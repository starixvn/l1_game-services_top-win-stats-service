export default {
  enabledLogs: true,
  database: {
    url: "mongodb://hotdog_backend:HotdogBackend@10.10.50.12:39400,10.10.50.13:39100,10.10.50.14:39400/?replicaSet=SPLocal0&appName=roundwatcher",
    options: {
      dbName: "minigame",
    },
  },
  adminApiSettings: {
    url: "http://sp-hd-admin-api-local-service:5000/api",
  },
  sentry: {
    sentryUrl: "https://13f39b8359404ed5aec23655e64ccf78@sentry.lumigame.com/2",
    logIdentifier: "top-win-stats-service",
    env: "LOCAL",
  },
  metrics: {
    enable: true,
    secretKey: "6c1f0f28-70f2-46ae-b031-22624a6cd8df",
  },
};
