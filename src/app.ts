import cors from "@fastify/cors";
import Fastify from "fastify";
import { logger } from "sc-common";
import appConfigs from "./app-configs";
import { ContainerRegistry } from "./container-registry";
import AppBoostrapHandler from "./handlers/app-boostrap-handler";
import authenticationHelper from "./helpers/authentication-helper";
import Router from "./routes";
import { configureDatabase } from "./helpers/configure-db";

const fastify = Fastify({
  logger: appConfigs.enabledLogs,
  ignoreDuplicateSlashes: true,
  requestTimeout: 60,
});

fastify.register(cors, {
  origin: "*",
});

fastify.setErrorHandler(async (error, request, reply) => {
  console.log(error);
  logger.logError(error);
  reply.status(500).send({ error: "Something went wrong" });
});

const start = async () => {
  try {
    const { database, sentry, enabledLogs } = appConfigs;
    enabledLogs && logger.start(sentry);
    configureDatabase(database);

    const container = new ContainerRegistry().register(appConfigs);

    const router = container.resolve<Router>("routers");
    const monitor = container.resolve<AppBoostrapHandler>("appBoostrapHandler");
    router.registerRoute(fastify);
    await monitor.initWatcher();

    await fastify.listen({ port: 5000, host: "0.0.0.0" });

    console.log(`Service started at ${new Date().toLocaleDateString()} - ${new Date().toLocaleTimeString()}`);
  } catch (err) {
    fastify.log.error(err);
    console.log(err);
    logger.logError(err);
    process.exit(1);
  }
};

start();
