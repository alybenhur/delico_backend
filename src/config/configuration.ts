// src/config/configuration.ts
export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/rappi-clone',
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-me',
    expiresIn: process.env.JWT_EXPIRATION || '1d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },

  googleMaps: {
    apiKey: process.env.GOOGLE_MAPS_API_KEY || '',
  },

  payu: {
    merchantId: process.env.PAYU_MERCHANT_ID || '',
    apiKey: process.env.PAYU_API_KEY || '',
    apiLogin: process.env.PAYU_API_LOGIN || '',
    accountId: process.env.PAYU_ACCOUNT_ID || '',
    baseUrl: process.env.PAYU_BASE_URL || 'https://sandbox.api.payulatam.com',
  },

  tracking: {
    updateInterval: parseInt(process.env.TRACKING_UPDATE_INTERVAL || '30000', 10),
  },
});