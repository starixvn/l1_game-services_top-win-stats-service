export default {
  enabledLogs: true,
  database: {
    url: "mongodb://svc_readonly:svcReadonly@10.10.50.12:39200,10.10.50.13:39200,10.10.50.14:39200/?replicaSet=L2Local&appName=roundwatcher",
    options: {
      dbName: "minigame",
    },
  },
  adminApiSettings: {
    url: "http://l2-admin-api-local-service:5000/api",
  },
  sentry: {
    sentryUrl: "https://acb36eb835d948d68c1aad9873754d51@sentry.lumigame.com/27",
    logIdentifier: "round-watcher-service",
    env: "LOCAL",
  },
  metrics: {
    enable: true,
    secretKey: "6c1f0f28-70f2-46ae-b031-22624a6cd8df",
  },
};
