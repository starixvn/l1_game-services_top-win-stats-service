export default {
  enabledLogs: true,
  database: {
    url: "mongodb://svc_readonly:svcReadonly@10.10.50.12:39201,10.10.50.13:39201,10.10.50.14:39201/?replicaSet=L2pLocal&appName=roundwatcher",
    options: {
      dbName: "minigame",
    },
  },
  adminApiSettings: {
    url: "http://l2-admin-api-local1-service:5000/api",
  },
  sentry: {
    sentryUrl: "https://acb36eb835d948d68c1aad9873754d51@sentry.lumigame.com/27",
    logIdentifier: "round-watcher-service",
    env: "LOCAL_1",
  },
  metrics: {
    enable: true,
    secretKey: "6c1f0f28-70f2-46ae-b031-22624a6cd8df",
  },
};
