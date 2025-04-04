export default {
  enabledLogs: true,
  database: {
    url: "mongodb://lmn_backend:LmnBackend@10.10.50.12:39102,10.10.50.13:39102,10.10.50.14:39102/?replicaSet=L1ppLocal&appName=roundwatcher",
    options: {
      dbName: "minigame",
    },
  },
  adminApiSettings: {
    url: "http://l1-admin-api-local2-service:5000/api",
  },
  sentry: {
    sentryUrl: "https://13f39b8359404ed5aec23655e64ccf78@sentry.lumigame.com/2",
    logIdentifier: "top-win-stats-service",
    env: "LOCAL_2",
  },
  metrics: {
    enable: true,
    secretKey: "6c1f0f28-70f2-46ae-b031-22624a6cd8df",
  },
};
