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
  // Boolean flag to detect if code is running in the browser
  private isBrowser: boolean;

  // Qlik host configuration (OAuth2 based) pulled from environment variables
  private qlikConfig: HostConfig = {
    authType: 'oauth2',
    host: environment.qlik.host,
    clientId: environment.qlik.clientId,
    redirectUri: environment.qlik.redirectUri,
    accessTokenStorage: 'session', // Store access token in sessionStorage
  };

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    // Detect platform: true if running in browser, false if on server (SSR)
    this.isBrowser = isPlatformBrowser(this.platformId);

    // Configure Qlik OAuth2 authentication only when running in the browser
    if (this.isBrowser) {
      auth.setDefaultHostConfig(this.qlikConfig);
    }
  }

  /**
   * Fetches data from a Qlik Sense object (table/hypercube).
   * Used to retrieve table data from visual objects.
   *
   * @param objectId - The object ID of the Qlik table/chart
   * @param appId - The ID of the Qlik Sense app
   * @returns Array of rows with keys mapped to dimension/measure labels
   */
  async getObjectData(objectId: string, appId: string): Promise<any[]> {
    try {
      // Open a session with the specified Qlik app
      const appSession = openAppSession({ appId });

      // Get the document handle (app interface)
      const app = await appSession.getDoc();

      // Retrieve the object by ID (e.g., a chart/table object)
      const obj = await app.getObject(objectId);

      // Get layout metadata for the object (includes cube definition)
      const layout = await obj.getLayout();
      const hyperCube = layout.qHyperCube;

      // Guard: If the object is not a hypercube or is missing cube data
      if (!hyperCube) {
        console.warn('Object is not a hypercube or missing cube data.');
        return [];
      }

      // Fetch up to 1000 rows of data from the hypercube
      const data = await obj.getHyperCubeData('/qHyperCubeDef', [{
        qTop: 0,
        qLeft: 0,
        qHeight: 1000,
        qWidth: (hyperCube.qDimensionInfo?.length ?? 0) + (hyperCube.qMeasureInfo?.length || 0),
      }]);

      // Extract the actual matrix of data rows
      const matrix = data?.[0]?.qMatrix ?? [];

      // If no data was returned from the matrix
      if (!matrix.length) {
        console.warn('Still no rows from HyperCube fetch.');
        return [];
      }

      // Extract labels for dimensions and measures
      const dimensionFields = (hyperCube.qDimensionInfo ?? []).map((d: any) => d.qFallbackTitle);
      const measureFields = (hyperCube.qMeasureInfo ?? []).map((m: any) => m.qFallbackTitle);
      const allFields = [...dimensionFields, ...measureFields];

      // Apply sort order based on effective visual column order
      const sortOrder = hyperCube.qEffectiveInterColumnSortOrder ?? allFields.map((_, i) => i);
      const fields = sortOrder.map(i => allFields[i]);

      // Map each matrix row to a structured object with field names as keys
      const rows = matrix.map(row =>
        Object.fromEntries(
          row.map((cell: any, i: number) => [fields[i], cell.qText])
        )
      );

      // Log result and return mapped rows
      console.log('Extracted object data (via getHyperCubeData):', rows);
      return rows;

    } catch (err) {
      // Log and return empty array on error
      console.error('getObjectData failed:', err);
      return [];
    }
  }

  /**
   * This method (commented out) is a full metadata fetcher:
   * - Gets master dimensions, measures, visualizations, and all fields.
   * It can be re-enabled for development tools like dynamic dropdowns or builders.
   */
  /*
  async getAppData() {
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
      const appSession = openAppSession({ appId: environment.qlik.appId });
      const app = await appSession.getDoc();
      const allObjects = await app.getAllInfos();

      const masterDimensions: any[] = [];
      const masterMeasures: any[] = [];
      const masterVisualizations: any[] = [];

      for (const obj of allObjects) {
        const { qId, qType } = obj;

        if (qType === 'dimension') {
          const dimension = await app.getDimension(qId);
          const layout = await dimension.getLayout();
          const label = layout.qMeta?.title || qId;
          masterDimensions.push({ id: qId, label, type: 'dimension' });
        } else if (qType === 'measure') {
          const measure = await app.getMeasure(qId);
          const layout = await measure.getLayout();
          const label = layout.qMeta?.title || qId;
          masterMeasures.push({ id: qId, label, type: 'measure' });
        } else if (qType === 'masterobject') {
          const objectHandle = await app.getObject(qId);
          const layout = await objectHandle.getLayout();
          const label = layout.qMeta?.title || qId;
          const visualizationType = layout.visualization || 'unknown';
          masterVisualizations.push({ id: qId, label, visualizationType });
        }
      }

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
      const allFields = fieldLayout.qFieldList?.qItems?.map(field => ({
        name: field.qName,
        cardinal: field.qCardinal,
        tags: field.qTags,
      })) ?? [];

      console.log('Master Dimensions:', masterDimensions);
      console.log('Master Measures:', masterMeasures);
      console.log('Master Visualizations:', masterVisualizations);
      console.log('All Fields:', allFields);

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
  }
  */
}
