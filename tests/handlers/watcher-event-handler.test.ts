import WatcherEventHandler from "../../src/handlers/watcher-event-handler";
import { TopResultsHandler } from "../../src/handlers/top-result-handler";
import RoundBaseGameWatcher, { WatcherEvent } from "../../src/watchers/round-base-game-watcher";

jest.mock("../../src/watchers/round-base-game-watcher");
jest.mock("../../src/handlers/top-result-handler");

const topResultsHandler = new TopResultsHandler();

function initHandler() {
  return new WatcherEventHandler(topResultsHandler);
}

describe("WatcherEventHandler", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("attachListeners", () => {
    it("should register NEWROUND event", () => {
      //Arrange
      const handler = initHandler();
      const watcher = new RoundBaseGameWatcher({ id: 1, name: "game1" });

      //Act
      handler.attachListeners(watcher);

      //Assert
      expect(watcher.on).toHaveBeenCalledWith(WatcherEvent.NEWROUND, handler.handleNewRoundEvent);
    });
  });

  describe("handleNewRoundEvent", () => {
    it("should call topResultsHandler.updateTopResults with correct parameters", async () => {
      //Arrange
      const handler = initHandler();
      const newRound = {
        "1": {
          id: 1,
          time: new Date(),
          result: 10,
          settlementResult: {},
        },
      };

      //Act
      await handler.handleNewRoundEvent(newRound);

      //Assert
      expect(topResultsHandler.updateTopResults).toHaveBeenCalledWith(
        "1",
        expect.objectContaining({
          id: 1,
          time: expect.any(Date),
          result: 10,
          settlementResult: {},
        })
      );
    });
  });
});
