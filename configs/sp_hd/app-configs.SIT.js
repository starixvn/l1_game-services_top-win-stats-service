export default {
  enabledLogs: true,
  database: {
    url: "mongodb://hotdog_backend:HotdogBackend%40517@10.99.99.53:39530,10.99.99.54:39530,10.99.99.188:39530,10.99.99.187:39530/?replicaSet=SP-SIT&appName=roundwatcher",
    options: {
      dbName: "minigame",
    },
  },
  adminApiSettings: {
    url: "http://sp_hd_admin_api_sit:5000/api",
  },
  sentry: {
    sentryUrl: "http://52368c4019044019885440599c180bda@10.2.190.51:9009/24",
    logIdentifier: "top-win-stats-service",
    env: "SIT",
  },
  metrics: {
    enable: true,
    secretKey: "6c1f0f28-70f2-46ae-b031-22624a6cd8df",
  },
};
