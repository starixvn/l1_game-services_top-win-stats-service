export default {
  enabledLogs: true,
  database: {
    url: "mongodb://lmn_backend:%7Ba%22ggV3I%2FU%7CJl%291sdHEbe5x%5EA%7BL%21%3BYYT@10.99.99.53:37101,10.99.99.54:37102/?replicaSet=L2_SabaMain&appName=roundwatcher",
    options: {
      dbName: "minigame",
    },
  },
  adminApiSettings: {
    url: "http://l2_admin_api_prod:5000/api",
  },
  sentry: {
    sentryUrl: "http://2b5b82bf699543ddb296364568bc30be@10.2.189.50:9009/52",
    logIdentifier: "round-watcher-service",
    env: "PROD",
  },
  metrics: {
    enable: true,
    secretKey: "30d15293-c7de-4c77-9293-b85d6c5bfe1a",
  },
};
