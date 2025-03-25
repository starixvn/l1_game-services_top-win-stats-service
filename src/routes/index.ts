import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import WatcherManager from "../watchers/watcher-manager";

interface QueryParams {
  gameId: string;
}

export default class Router {
  private readonly watcherManager: WatcherManager;

  constructor(watcherManager: WatcherManager) {
    this.watcherManager = watcherManager;
  }

  registerRoute(fastify: FastifyInstance) {
    fastify.get("/", async (request: FastifyRequest, reply: FastifyReply) => {
      reply.code(200).send("Hello, I'm Round Watcher Service !!!");
    });

    fastify.get("/yearly-top-results", async (request: FastifyRequest<{ Querystring: QueryParams }>, reply: FastifyReply) => {
      const topResults = await this.watcherManager.getYearlyTopResults(request.query.gameId);
      reply.code(200).send(topResults);
    });

    fastify.get("/monthly-top-results", async (request: FastifyRequest<{ Querystring: QueryParams }>, reply: FastifyReply) => {
      const topResults = await this.watcherManager.getMonthlyTopResults(request.query.gameId);
      reply.code(200).send(topResults);
    });

    fastify.get("/yearly-top-cashout", async (request: FastifyRequest<{ Querystring: QueryParams }>, reply: FastifyReply) => {
      const topCashout = await this.watcherManager.getYearlyTopCashout(request.query.gameId);
      reply.code(200).send(topCashout);
    });

    fastify.get("/monthly-top-cashout", async (request: FastifyRequest<{ Querystring: QueryParams }>, reply: FastifyReply) => {
      const topCashout = await this.watcherManager.getMonthlyTopCashout(request.query.gameId);
      reply.code(200).send(topCashout);
    });
  }
}
