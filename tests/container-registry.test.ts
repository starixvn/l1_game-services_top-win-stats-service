import { ContainerRegistry } from "../src/container-registry";
import AppBoostrapHandler from "../src/handlers/app-boostrap-handler";
import LastResultHandler from "../src/handlers/last-result-handler";
import WatcherEventHandler from "../src/handlers/watcher-event-handler";
import Router from "../src/routes";
import WatcherManager from "../src/watchers/watcher-manager";

jest.mock("../src/handlers/app-boostrap-handler");
jest.mock("../src/handlers/last-result-handler");
jest.mock("../src/handlers/watcher-event-handler");
jest.mock("../src/watchers/watcher-manager");
jest.mock("../src/routes");

describe("ContainerRegistry", () => {
  describe("register", () => {
    const containerRegistry = new ContainerRegistry();
    const appConfigs = {};

    it("should register appConfigs as a value", () => {
      // Arrange
      const container = containerRegistry.register(appConfigs);

      // Act
      const registeredAppConfigs = container.resolve("appConfigs");

      // Assert
      expect(registeredAppConfigs).toBe(appConfigs);
    });

    it("should register routers as a class", () => {
      // Arrange
      const container = containerRegistry.register(appConfigs);

      // Act
      const registeredRouter = container.resolve("routers");

      // Assert
      expect(registeredRouter instanceof Router).toBeTruthy();
    });
  });

  describe("registerHandlers", () => {
    const containerRegistry = new ContainerRegistry();
    const container = containerRegistry.container;

    beforeAll(() => {
      containerRegistry.registerHandlers();
    });

    it("should register lastResultHandler as a singleton class", () => {
      // Act
      const registeredLastResultHandler = container.resolve("lastResultHandler");

      // Assert
      expect(registeredLastResultHandler instanceof LastResultHandler).toBeTruthy();
    });

    it("should register appBoostrapHandler as a singleton class", () => {
      // Act
      const registeredAppBoostrapHandler = container.resolve("appBoostrapHandler");

      // Assert
      expect(registeredAppBoostrapHandler instanceof AppBoostrapHandler).toBeTruthy();
    });
  });

  describe("registerWatchers", () => {
    const containerRegistry = new ContainerRegistry();
    const container = containerRegistry.container;

    beforeAll(() => {
      containerRegistry.registerWatchers();
    });

    it("should register watcherManager as a singleton class", () => {
      // Act
      const registeredWatcherManager = container.resolve("watcherManager");

      // Assert
      expect(registeredWatcherManager instanceof WatcherManager).toBeTruthy();
    });

    it("should register watcherEventHandler as a singleton class", () => {
      // Act
      const registeredWatcherEventHandler = container.resolve("watcherEventHandler");

      // Assert
      expect(registeredWatcherEventHandler instanceof WatcherEventHandler).toBeTruthy();
    });
  });
});
