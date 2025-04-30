export const environment = {
    production: false,

    // Qlik Cloud OAuth2 configuration (DO NOT hardcode secrets in real production apps)
    qlik: {
        host: 'kassovitz.us.qlikcloud.com',          // Qlik Cloud tenant hostname
        clientId: 'ad47b6faa9a6863ad6b378f151ff6cff', // Public client ID for browser-based OAuth
        appId: '615ed533-b2d0-48cc-8d43-db57cd809305',// Qlik App ID for embedded analytics
        redirectUri: 'http://localhost:4200/assets/oauth-callback.html' // Redirect URI for OAuth2
    }
};
