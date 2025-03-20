import LastResultHandler from "../../src/handlers/last-result-handler";
import WatcherEventHandler from "../../src/handlers/watcher-event-handler";
import { GameConfig } from "../../src/types";
import RoundBaseGameWatcher from "../../src/watchers/round-base-game-watcher";
import WatcherManager from "../../src/watchers/watcher-manager";

jest.mock("../../src/watchers/round-base-game-watcher");
jest.mock("../../src/handlers/last-result-handler");
jest.mock("../../src/handlers/watcher-event-handler");

const gameConfig: GameConfig = {
  id: 2,
  name: "xocxoc",
};
const lastResultHandler = new LastResultHandler();
const watcherEventHandler = new WatcherEventHandler(lastResultHandler);

function initWatcherManager() {
  return new WatcherManager(watcherEventHandler, lastResultHandler);
}
describe("WatcherManager", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  describe("addWatcher", () => {
    describe("when watcher for game doesnt exist", () => {
      it("should call watcherEventHandler.attachListeners", () => {
        //Arrange
        const watcherManager = initWatcherManager();

        //Act
        watcherManager.addWatcher(gameConfig);

        //Assert
        expect(watcherEventHandler.attachListeners).toBeCalled();
      });

      it("should add watcher to watcherManager.watchers", () => {
        //Arrange
        const watcherManager = initWatcherManager();

        //Act
        watcherManager.addWatcher(gameConfig);

        //Assert
        // @ts-expect-error
        expect(watcherManager.watchers[gameConfig.id]).toBeDefined();
      });
    });

    describe("when watcher for game exists", () => {
      it("should not call watcherEventHandler.attachListeners", () => {
        //Arrange
        const watcherManager = initWatcherManager();
        // @ts-expect-error
        watcherManager.watchers[gameConfig.id] = new RoundBaseGameWatcher(gameConfig);

        //Act
        watcherManager.addWatcher(gameConfig);

        //Assert
        expect(watcherEventHandler.attachListeners).not.toBeCalled();
      });
    });
  });

  describe("removeWatcher", () => {
    it("should close changeStream", () => {
      //Arrange
      const watcherManager = initWatcherManager();
      const watcher = new RoundBaseGameWatcher(gameConfig);
      // @ts-expect-error
      watcherManager.watchers[gameConfig.id] = watcher;

      //Act
      watcherManager.removeWatcher(gameConfig.id.toString());

      //Assert
      expect(watcher.closeChangeStream).toBeCalled();
    });

    it("should remove watcher from watcherManager.watchers", async () => {
      //Arrange
      const watcherManager = initWatcherManager();
      const watcher = new RoundBaseGameWatcher(gameConfig);
      // @ts-expect-error
      watcherManager.watchers[gameConfig.id] = watcher;

      //Act
      await watcherManager.removeWatcher(gameConfig.id.toString());

      //Assert
      // @ts-expect-error
      expect(watcherManager.watchers[gameConfig.id]).toBeUndefined();
    });
  });

  describe("removeAllWatchers", () => {
    it("watcherManager.watchers should be empty", async () => {
      //Arrange
      const watcherManager = initWatcherManager();
      const watcher = new RoundBaseGameWatcher(gameConfig);
      // @ts-expect-error
      watcherManager.watchers[gameConfig.id] = watcher;

      //Act
      await watcherManager.removeAllWatchers();

      //Assert
      // @ts-expect-error
      expect(watcherManager.watchers).toEqual({});
    });
  });

  describe("updateWatchers", () => {
    it("should add & remove games changestream", async () => {
      //Arrange
      const watcherManager = initWatcherManager();
      const watcher = new RoundBaseGameWatcher(gameConfig);
      // @ts-expect-error
      watcherManager.watchers[gameConfig.id] = watcher;

      //Act
      await watcherManager.updateWatchers([{ id: 3, name: "txtu" }]);

      //Assert
      // @ts-expect-error
      expect(watcherManager.watchers[gameConfig.id]).toBeUndefined();
      // @ts-expect-error
      expect(watcherManager.watchers[3]).toBeDefined();
    });
  });
});
