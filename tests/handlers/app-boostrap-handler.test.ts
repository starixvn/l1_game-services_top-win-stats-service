import appConfigs from "../../src/app-configs";
import AppBoostrapHandler from "../../src/handlers/app-boostrap-handler";
import LastResultHandler from "../../src/handlers/last-result-handler";
import WatcherEventHandler from "../../src/handlers/watcher-event-handler";
import authHelper from "../../src/helpers/authentication-helper";
import { GameConfig } from "../../src/types";
import WatcherManager from "../../src/watchers/watcher-manager";

jest.mock("../../src/handlers/last-result-handler");
jest.mock("../../src/watchers/watcher-manager");
jest.mock("../../src/helpers/authentication-helper");
jest.mock("../../src/handlers/watcher-event-handler");

describe("AppBoostrapHandler", () => {
  let lastResultHandler: LastResultHandler;
  let watcherManager: WatcherManager;
  let watcherEventHandler: WatcherEventHandler;

  beforeEach(() => {
    lastResultHandler = new LastResultHandler();
    watcherEventHandler = new WatcherEventHandler(lastResultHandler);
    watcherManager = new WatcherManager(watcherEventHandler, lastResultHandler);
  });

  const games: GameConfig[] = [
    { id: 1, name: "Game 1" },
    { id: 2, name: "Game 2" },
  ];

  beforeEach(() => {
    (authHelper.get as jest.Mock).mockResolvedValue(games);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("initWatcher", () => {
    it("should call getLastResult for each supported game", async () => {
      // Act
      const appBootstrapHandler = new AppBoostrapHandler(lastResultHandler, watcherManager);
      await appBootstrapHandler.initWatcher();

      // Assert
      expect(lastResultHandler.getLastResult).toHaveBeenCalledTimes(1);
      expect(lastResultHandler.getLastResult).toHaveBeenCalledWith(games);
    });

    it("should call addWatcher for each supported game", async () => {
      // Act
      const appBootstrapHandler = new AppBoostrapHandler(lastResultHandler, watcherManager);
      await appBootstrapHandler.initWatcher();

      // Assert
      expect(watcherManager.addWatcher).toHaveBeenCalledTimes(2);
      expect(watcherManager.addWatcher).toHaveBeenCalledWith(games[0]);
      expect(watcherManager.addWatcher).toHaveBeenCalledWith(games[1]);
    });
  });

  describe("getSupportedGames", () => {
    it("should call authHelper.get with the correct URL", async () => {
      //Act
      const appBootstrapHandler = new AppBoostrapHandler(lastResultHandler, watcherManager);
      await appBootstrapHandler.getSupportedGames();

      //Assert
      expect(authHelper.get).toHaveBeenCalledTimes(1);
      expect(authHelper.get).toHaveBeenCalledWith(`${appConfigs.adminApiSettings.url}/lobby/getRoundTimerGame`);
    });

    it("should return the games", async () => {
      //Act
      const appBootstrapHandler = new AppBoostrapHandler(lastResultHandler, watcherManager);
      const supportedGames = await appBootstrapHandler.getSupportedGames();

      //Assert
      expect(supportedGames).toEqual(games);
    });
  });
});
