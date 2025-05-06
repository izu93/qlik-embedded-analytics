import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { auth } from '@qlik/api';
import { openAppSession } from '@qlik/api/qix';
import { HostConfig } from '@qlik/api/auth';
import { environment } from '../../environments/environment';

// Extend the Window interface to include the 'x' property
declare global {
  interface Window {
    x: any;
  }
}

@Injectable({
  providedIn: 'root',
})
export class QlikAPIService {
  qlik: any; // Add this at the top of your TS file

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
   * Retrieves the current OAuth2 access token from session storage.
   * Used for authenticated REST API calls.
   */
  getAccessTokenFromSessionStorage(): string | null {
    const key = Object.keys(sessionStorage).find(
      (k) => k.includes('access-token') && sessionStorage.getItem(k)
    );
    return key ? sessionStorage.getItem(key) : null;
  }

  /**
   * Connects to a Qlik Sense app and fetches rows from a visual object (hypercube).
   * Returns structured data by mapping dimension and measure titles to cell values.
   *
   * @param objectId - The object ID of the Qlik table/chart
   * @param appId - The ID of the Qlik Sense app
   * @returns Array of rows with keys mapped to dimension/measure labels
   */
  async getObjectData(objectId: string, appId: string): Promise<any[]> {
    try {
      const appSession = openAppSession({ appId });
      window.x = appSession;

      const app = await appSession.getDoc();
      const obj = await app.getObject(objectId);
      const layout = await obj.getLayout();
      const hyperCube = layout.qHyperCube;

      if (!hyperCube) {
        console.warn('Object is not a hypercube or missing cube data.');
        return [];
      }

      const data = await obj.getHyperCubeData('/qHyperCubeDef', [
        {
          qTop: 0,
          qLeft: 0,
          qHeight: 1000,
          qWidth:
            (hyperCube.qDimensionInfo?.length ?? 0) +
            (hyperCube.qMeasureInfo?.length || 0),
        },
      ]);

      const matrix = data?.[0]?.qMatrix ?? [];
      if (!matrix.length) {
        console.warn('No rows returned from hypercube.');
        return [];
      }

      const dimensionFields = (hyperCube.qDimensionInfo ?? []).map(
        (d) => d.qFallbackTitle
      );
      const measureFields = (hyperCube.qMeasureInfo ?? []).map(
        (m) => m.qFallbackTitle
      );
      const fields = [...dimensionFields, ...measureFields];

      const rows = matrix.map((row) =>
        Object.fromEntries(row.map((cell, i) => [fields[i], cell.qText]))
      );

      console.log('Extracted object data (fixed order):', rows);
      return rows;
    } catch (err) {
      console.error('getObjectData failed:', err);
      return [];
    }
  }

  /**
   * Retrieves the authenticated Qlik Cloud user's name using the REST API.
   * Falls back to email or subject if name is not available.
   */
  async getCurrentUserName(): Promise<string> {
    if (!this.isBrowser) return 'Server';

    // Retry logic for token availability
    for (let attempt = 0; attempt < 10; attempt++) {
      const token = this.getAccessTokenFromSessionStorage();
      if (token) {
        try {
          const response = await fetch(
            `https://${this.qlikConfig.host}/api/v1/users/me`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const user = await response.json();
          return user.name || user.email || user.subject || 'Unknown User';
        } catch (err) {
          console.error('Failed to fetch Qlik user:', err);
          return 'Unknown User';
        }
      }

      // Wait 100ms before retry
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.warn('Access token not found after multiple attempts.');
    return 'Unknown User';
  }

  /*saveToBackend() in QlikAPIService*/
  saveToBackend(changedRows: any[]): Promise<any> {
    return fetch('/api/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(changedRows),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to save data to backend');
        }
        return response.json();
      })
      .then((data) => {
        console.log('✅ Backend Save Response:', data);
        return data;
      });
  }

  /*Optional getFromBackend() if you want to load from /data*/
  async getFromBackend(): Promise<any[]> {
    const res = await fetch(`${environment.backendUrl}/api/data`);
    return await res.json();
  }

  async fetchPage(
    appId: string,
    objectId: string,
    page: number,
    pageSize: number
  ): Promise<{ rows: any[]; totalRows: number }> {
    try {
      const appSession = openAppSession({ appId });
      const app = await appSession.getDoc();
      const obj = await app.getObject(objectId);
      const layout = await obj.getLayout();
      const hyperCube = layout.qHyperCube;

      if (!hyperCube) throw new Error('No hypercube data.');

      const totalRows = hyperCube.qSize?.qcy ?? 0;
      const width =
        (hyperCube.qDimensionInfo?.length ?? 0) +
        (hyperCube.qMeasureInfo?.length ?? 0);

      const qTop = (page - 1) * pageSize;
      const qHeight = Math.min(pageSize, totalRows - qTop);

      const data = await obj.getHyperCubeData('/qHyperCubeDef', [
        {
          qTop,
          qLeft: 0,
          qHeight,
          qWidth: width,
        },
      ]);

      const matrix = data[0]?.qMatrix || [];

      // ❗ Strict field order: do not use qEffectiveInterColumnSortOrder
      const dimensionFields = (hyperCube.qDimensionInfo ?? []).map(
        (d) => d.qFallbackTitle
      );
      const measureFields = (hyperCube.qMeasureInfo ?? []).map(
        (m) => m.qFallbackTitle
      );
      const fields = [...dimensionFields, ...measureFields];

      const rows = matrix.map((row) =>
        Object.fromEntries(row.map((cell, i) => [fields[i], cell.qText]))
      );

      console.log(`Page ${page} →`, rows);
      return { rows, totalRows };
    } catch (err) {
      console.error('fetchPage() failed:', err);
      return { rows: [], totalRows: 0 };
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
