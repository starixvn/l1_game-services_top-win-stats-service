export default {
  enabledLogs: true,
  database: {
    url: "mongodb://lmn_backend:M7K4ttH%2AtZ3ml%3F%29%7CA%5DjN4%3FLBhwF%266IO%3C@10.146.34.26:39110,10.146.34.27:39110,10.146.34.30:39110,10.146.34.28:39110/?replicaSet=SabaMain&appName=roundwatcher",
    options: {
      dbName: "minigame",
    },
  },
  adminApiSettings: {
    url: "http://l1-admin-api-klprod-service:5000/api",
  },
  sentry: {
    sentryUrl: "http://58fc00e79ab34a3bab04a79038760cb8@sentry-scklprod-ovs.ops-klprod.gamora.prod/8",
    logIdentifier: "top-win-stats-service",
    env: "PROD",
  },
  metrics: {
    enable: true,
    secretKey: "30d15293-c7de-4c77-9293-b85d6c5bfe1a",
  },
};
