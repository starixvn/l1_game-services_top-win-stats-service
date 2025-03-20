export default {
  enabledLogs: true,
  database: {
    url: "mongodb://lmn_backend:%2EX%7D%29K%2CN2i%7EG%3E%5EwL%2BEd%3BR0V%25OA6Nbt%5B%21o@10.99.99.54:27101,10.99.99.53:27102/?replicaSet=SabaMain&appName=roundwatcher",
    options: {
      dbName: "minigame",
    },
  },
  adminApiSettings: {
    url: "http://l1_admin_api_prod:5000/api",
  },
  sentry: {
    sentryUrl: "http://58fc00e79ab34a3bab04a79038760cb8@10.2.189.50:9009/8",
    logIdentifier: "round-watcher-service",
    env: "PROD",
  },
  metrics: {
    enable: true,
    secretKey: "30d15293-c7de-4c77-9293-b85d6c5bfe1a",
  },
};
