export default {
  enabledLogs: true,
  database: {
    url: "mongodb://hotdog_backend:HotdogBackend@10.99.99.53:39530,10.99.99.54:39530,10.99.99.188:39530,10.99.99.187:39530/?replicaSet=SP-PROD&appName=roundwatcher",
    options: {
      dbName: "minigame",
    },
  },
  adminApiSettings: {
    url: "http://sp_hd_admin_api_prod:5000/api",
  },
  sentry: {
    sentryUrl: "http://58fc00e79ab34a3bab04a79038760cb8@10.2.189.50:9009/8",
    logIdentifier: "top-win-stats-service",
    env: "PROD",
  },
  metrics: {
    enable: true,
    secretKey: "30d15293-c7de-4c77-9293-b85d6c5bfe1a",
  },
};
