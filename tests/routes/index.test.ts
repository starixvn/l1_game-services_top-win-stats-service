import { FastifyInstance } from "fastify";
import LastResultHandler from "../../src/handlers/last-result-handler";
import WatcherEventHandler from "../../src/handlers/watcher-event-handler";
import Router from "../../src/routes";
import WatcherManager from "../../src/watchers/watcher-manager";

jest.mock("../../src/handlers/last-result-handler");
jest.mock("../../src/watchers/watcher-manager");
jest.mock("../../src/handlers/watcher-event-handler");

describe("Router", () => {
  let fastifyInstance: FastifyInstance;
  let lastResultHandler: LastResultHandler;
  let watcherManager: WatcherManager;
  let watcherEventHandler: WatcherEventHandler;
  let router: Router;

  beforeEach(() => {
    fastifyInstance = {
      get: jest.fn(),
      post: jest.fn(),
    } as unknown as FastifyInstance;
    lastResultHandler = new LastResultHandler();
    watcherEventHandler = new WatcherEventHandler(lastResultHandler);
    watcherManager = new WatcherManager(watcherEventHandler, lastResultHandler);
    router = new Router(lastResultHandler, watcherManager);
  });

  describe("registerRoute", () => {
    const replyMock = {
      code: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    beforeEach(() => {
      router.registerRoute(fastifyInstance);
    });

    describe('route "/"', () => {
      it('should register route get "/"', () => {
        // Assert
        expect(fastifyInstance.get).toHaveBeenCalledWith("/", expect.any(Function));
      });

      it("should reply successful", () => {
        // Arrange
        const getRoot = (fastifyInstance.get as jest.Mock).mock.calls.find((call) => call[0] === "/")[1];

        // Act
        getRoot({}, replyMock);

        // Assert
        expect(replyMock.code).toHaveBeenCalledWith(200);
        expect(replyMock.send).toHaveBeenCalledWith("Hello, I'm Round Watcher Service !!!");
      });
    });

    describe('route "/api/lastResult"', () => {
      it('should register route get "/api/lastResult"', () => {
        // Act
        router.registerRoute(fastifyInstance);

        // Assert
        expect(fastifyInstance.get).toHaveBeenCalledWith("/api/lastResult", expect.any(Function));
      });

      it("should reply last result", () => {
        // Arrange
        const getRoot = (fastifyInstance.get as jest.Mock).mock.calls.find((call) => call[0] === "/api/lastResult")[1];

        // Act
        getRoot({}, replyMock);

        // Assert
        expect(replyMock.code).toHaveBeenCalledWith(200);
        expect(replyMock.send).toHaveBeenCalledWith(lastResultHandler.get());
      });
    });

    describe('route "/api/lobby"', () => {
      const req = { body: { games: ["game1", "game2"] } };

      it('should register route post "/api/lobby"', () => {
        // Assert
        expect(fastifyInstance.post).toHaveBeenCalledWith("/api/lobby", expect.any(Function));
      });

      it("should call update ", async () => {
        // Act
        const postLobbyHandler = (fastifyInstance.post as jest.Mock).mock.calls.find((call) => call[0] === "/api/lobby")[1];
        await postLobbyHandler(req, replyMock);

        // Assert
        expect(watcherManager.updateWatchers).toHaveBeenCalledWith(["game1", "game2"]);
      });

      it("should reply received true", async () => {
        // Arrange
        const postLobbyHandler = (fastifyInstance.post as jest.Mock).mock.calls.find((call) => call[0] === "/api/lobby")[1];

        // Act
        await postLobbyHandler(req, replyMock);

        // Assert
        expect(replyMock.code).toHaveBeenCalledWith(200);
        expect(replyMock.send).toHaveBeenCalledWith({ received: true });
      });
    });
  });
});
