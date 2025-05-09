export const environment = {
    production: false,

    // Qlik Cloud OAuth2 configuration (DO NOT hardcode secrets in real production apps)
    qlik: {
        host: 'karthikburra93.us.qlikcloud.com',          // Qlik Cloud tenant hostname
        //clientId: '0fbd47217ee6d5d02dc80e005d2a715a', // Public client ID for browser-based OAuth
        clientId: 'ed20a3eb6fe8481f57214496f99bb7d8', // Public client ID for browser-based OAuth
        appId: '27edee1d-4af7-467a-a659-b5223c1e09f1',// Qlik App ID for embedded analytics
        objectId: 'YgKjEUA', // <-- Fields for writeback table
        //redirectUri: 'https://qlik-embedded-analytics-git-main-kburra193s-projects.vercel.app/assets/oauth-callback.html', // Redirect URI for OAuth2
        redirectUri: 'http://localhost/assets/oauth-callback.html', // Redirect URI for OAuth2
       // webIntegrationId: 's-iTjqYmN16rAJC0jVaT_NotvliLmPKm', // Web integration ID for Qlik Cloud
    },
    backendUrl: 'http://localhost:3000', // Backend API URL for writeback service
};
