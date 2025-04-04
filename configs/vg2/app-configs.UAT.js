export default {
  enabledLogs: true,
  database: {
    url: "mongodb://lmn_backend:LmnBackend%4022027@10.99.99.187:37201/?replicaSet=SabaL2UAT&appName=roundwatcher",
    options: {
      dbName: "minigame",
    },
  },
  adminApiSettings: {
    url: "http://l2-admin-api-uat-service:5000/api",
  },
  sentry: {
    sentryUrl: "http://8ac47fca6d3e4a41908896a64ef201ac@10.2.190.51:9009/53",
    logIdentifier: "top-win-stats-service",
    env: "UAT",
  },
  metrics: {
    enable: true,
    secretKey: "6c1f0f28-70f2-46ae-b031-22624a6cd8df",
  },
};
