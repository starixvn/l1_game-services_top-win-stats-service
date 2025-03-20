export default {
  enabledLogs: true,
  database: {
    url: "mongodb://lmn_backend:M7K4ttH%2AtZ3ml%3F%29%7CA%5DjN4%3FLBhwF%266IO%3C@10.99.99.53:39110,10.99.99.54:39110,10.99.99.188:39110,10.99.99.187:39110/?replicaSet=SabaMain&appName=roundwatcher",
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
