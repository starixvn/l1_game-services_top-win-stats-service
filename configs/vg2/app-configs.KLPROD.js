export default {
  enabledLogs: true,
  database: {
    url: "mongodb://lmn_backend:%21%23x97%25uYZv%2A%5E%25%3E%7C%2Aqg%40E7FHi%3F9l%7B9r%3CK@10.146.34.26:39210,10.146.34.27:39210,10.146.34.30:39210,10.146.34.28:39210/?replicaSet=L2_SabaMain&appName=roundwatcher",
    options: {
      dbName: "minigame",
    },
  },
  adminApiSettings: {
    url: "http://l2-admin-api-klprod-service:5000/api",
  },
  sentry: {
    sentryUrl: "http://2b5b82bf699543ddb296364568bc30be@sentry-scklprod-ovs.ops-klprod.gamora.prod/52",
    logIdentifier: "top-win-stats-service",
    env: "PROD",
  },
  metrics: {
    enable: true,
    secretKey: "30d15293-c7de-4c77-9293-b85d6c5bfe1a",
  },
};
