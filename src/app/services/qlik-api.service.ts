import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { auth } from '@qlik/api';
import { openAppSession } from '@qlik/api/qix';
import { HostConfig } from '@qlik/api/auth';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class QlikAPIService {
  private isBrowser: boolean;

  // Qlik configuration pulled from environment variables
  private qlikConfig: HostConfig = {
    authType: 'oauth2',
    host: environment.qlik.host,
    clientId: environment.qlik.clientId,
    redirectUri: environment.qlik.redirectUri,
    accessTokenStorage: 'session',
  };

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    // Detect if we are running in the browser (vs server-side rendering)
    this.isBrowser = isPlatformBrowser(this.platformId);

    // Set Qlik authentication config only on the browser side
    if (this.isBrowser) {
      auth.setDefaultHostConfig(this.qlikConfig);
    }
  }

  /**
   * Fetches Qlik app metadata including:
   * - Master dimensions
   * - Master measures
   * - Master visualizations
   * - All available fields
   */
  /*  async getAppData() {
     // Guard: prevent running Qlik APIs on the server (SSR)
     if (!this.isBrowser) {
       console.warn('getAppData() was called on the server. Skipping Qlik API call.');
       return {
         dimensions: [],
         measures: [],
         visualizations: [],
         allFields: [],
       };
     }
 
     try {
       console.log('Opening app session...');
 
       // Open session with the Qlik app using appId from environment
       const appSession = openAppSession({
         appId: environment.qlik.appId,
       });
 
       // Retrieve document interface to interact with app contents
       const app = await appSession.getDoc();
       console.log('App document loaded.');
 
       // Get all metadata objects in the app (master dims, measures, visualizations)
       const allObjects = await app.getAllInfos();
 
       const masterDimensions: any[] = [];
       const masterMeasures: any[] = [];
       const masterVisualizations: any[] = [];
 
       for (const obj of allObjects) {
         const { qId, qType } = obj;
 
         if (qType === 'dimension') {
           if (!qId) {
             console.warn('Skipping dimension with undefined qId');
             continue;
           }
           const dimension = await app.getDimension(qId);
           const layout = await dimension.getLayout();
           const label = (layout.qMeta as any)?.title || qId;
           masterDimensions.push({ id: qId, label, type: 'dimension' });
 
         } else if (qType === 'measure') {
           if (!qId) {
             console.warn('Skipping measure with undefined qId');
             continue;
           }
           const measure = await app.getMeasure(qId);
           const layout = await measure.getLayout();
           const label = (layout.qMeta as any)?.title || qId;
           masterMeasures.push({ id: qId, label, type: 'measure' });
 
         } else if (qType === 'masterobject') {
           if (!qId) {
             console.warn('Skipping master object with undefined qId');
             continue;
           }
           const objectHandle = await app.getObject(qId);
           const layout = await objectHandle.getLayout();
           const label = (layout.qMeta as any)?.title || qId;
           const visualizationType = (layout as any)?.visualization || 'unknown';
           masterVisualizations.push({ id: qId, label, visualizationType });
         }
       }
 
       // Get all fields in the app, including hidden/system/derived fields
       const fieldListObj = await app.createSessionObject({
         qInfo: { qType: 'FieldList' },
         qFieldListDef: {
           qShowSystem: false,
           qShowHidden: false,
           qShowDerivedFields: true,
           qShowSemantic: true,
           qShowSrcTables: true,
         }
       });
 
       const fieldLayout = await fieldListObj.getLayout();
       const allFields = fieldLayout.qFieldList?.qItems?.map((field: any) => ({
         name: field.qName,
         cardinal: field.qCardinal,
         tags: field.qTags,
       })) ?? [];
 
       // Debug logs
       console.log('✅ Master Dimensions:', masterDimensions);
       console.log('✅ Master Measures:', masterMeasures);
       console.log('✅ Master Visualizations:', masterVisualizations);
       console.log('✅ All Fields:', allFields);
 
       // Return all metadata to component or caller
       return {
         dimensions: masterDimensions,
         measures: masterMeasures,
         visualizations: masterVisualizations,
         allFields,
       };
     } catch (err) {
       console.error('Error fetching Qlik app data:', err);
       return {
         dimensions: [],
         measures: [],
         visualizations: [],
         allFields: [],
       };
     }
   } */

  async getObjectData(objectId: string, appId: string): Promise<any[]> {
    try {
      const appSession = openAppSession({ appId });
      const app = await appSession.getDoc();

      const obj = await app.getObject(objectId);
      const layout = await obj.getLayout();
      const hyperCube = layout.qHyperCube;

      if (!hyperCube) {
        console.warn('Object is not a hypercube or missing cube data.');
        return [];
      }

      // Explicitly fetch data from the cube
      const data = await obj.getHyperCubeData('/qHyperCubeDef', [{
        qTop: 0,
        qLeft: 0,
        qHeight: 1000, // fetch max 1000 rows
        qWidth: (hyperCube.qDimensionInfo?.length ?? 0) + (hyperCube.qMeasureInfo?.length || 0),
      }]);

      const matrix = data?.[0]?.qMatrix ?? [];

      if (!matrix.length) {
        console.warn('Still no rows from HyperCube fetch.');
        return [];
      }

      const dimensionFields = (hyperCube.qDimensionInfo ?? []).map((d: any) => d.qFallbackTitle);
      const measureFields = (hyperCube.qMeasureInfo ?? []).map((m: any) => m.qFallbackTitle);
      const allFields = [...dimensionFields, ...measureFields];

      // This ensures the fields match the visual column order
      const sortOrder = hyperCube.qEffectiveInterColumnSortOrder ?? allFields.map((_, i) => i);
      const fields = sortOrder.map(i => allFields[i]);

      const rows = matrix.map(row =>
        Object.fromEntries(row.map((cell: any, i: number) => [fields[i], cell.qText]))
      );
      console.log('Extracted object data (via getHyperCubeData):', rows);
      return rows;

    } catch (err) {
      console.error('getObjectData failed:', err);
      return [];
    }
  }



}
