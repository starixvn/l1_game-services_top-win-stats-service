import { Binary } from "bson";
import EventEmitter from "events";
import { ObjectId } from "mongodb";
import { logger } from "sc-common";
import { GameConfig } from "../../src/types";
import RoundBaseGameWatcher, { WatcherEvent } from "../../src/watchers/round-base-game-watcher";

const mockChangeStream = new EventEmitter();
// @ts-expect-error
mockChangeStream.close = jest.fn();

const onEvent = jest.spyOn(mockChangeStream, "on");

jest.mock("../../src/models/game-rounds", () =>
  jest.fn(() => ({
    watch: jest.fn(() => mockChangeStream),
  }))
);
jest.mock("sc-common", () => ({
  logger: {
    logError: jest.fn(),
  },
}));

const gameConfig: GameConfig = {
  id: 2,
  name: "xocxoc",
};

function initWatcher() {
  return new RoundBaseGameWatcher(gameConfig);
}
describe("RoundBaseGameWatcher", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  describe("constructor", () => {
    it("should init changestream and call on 3 times", () => {
      //Act
      const watcher = initWatcher();

      //Assert
      expect(onEvent).toBeCalledTimes(3);
    });
  });
  describe("handleChangeStreamChange", () => {
    describe("when operation type is not insert", () => {
      it("should not call emit", () => {
        //Arrange
        const watcher = initWatcher();
        const emitEvent = jest.spyOn(watcher, "emit");

        //Act
        watcher.handleChangeStreamChange({ operationType: "modify", _id: "123", collectionUUID: new Binary("1") });

        //Assert
        expect(emitEvent).not.toBeCalled();
      });
    });

    describe("when operation type is insert", () => {
      it("should call emit", () => {
        //Arrange
        const watcher = initWatcher();
        const emitEvent = jest.spyOn(watcher, "emit");

        const newRound = {
          id: 100,
          time: new Date(),
          result: { red1: false, red2: false, red3: false, red4: true },
          settlementResult: {
            odd: true,
            even: false,
            red2: false,
            red3: false,
            red4: false,
            white3: true,
            white4: false,
          },
        };

        //Act
        watcher.handleChangeStreamChange({
          operationType: "insert",
          _id: "123",
          ns: { coll: "sedie_rounds", db: "minigame" },
          documentKey: { _id: new ObjectId("64d0bfa5513bd65d282e2532") },
          fullDocument: newRound,
          collectionUUID: new Binary("1"),
        });

        //Assert
        expect(emitEvent).toBeCalledWith(WatcherEvent.NEWROUND, { [gameConfig.id]: newRound });
      });
    });
  });

  describe("handleChangeStreamError", () => {
    it("should call logger.logError", () => {
      //Arrange
      const watcher = initWatcher();
      const error = new Error();
      //Act
      watcher.handleChangeStreamError(error);

      //Assert
      expect(logger.logError).toHaveBeenCalledWith(error);
    });
  });

  describe("closeChangeStream", () => {
    it("should remove all listeners", async () => {
      //Arrange
      const watcher = initWatcher();
      const emitEvent = jest.spyOn(mockChangeStream, "removeAllListeners");
      //Act
      await watcher.closeChangeStream();

      //Assert
      expect(emitEvent).toHaveBeenCalled();
    });
  });

  describe("handleChangeStreamClosed", () => {
    it("should call emit", () => {
      //Arrange
      const watcher = initWatcher();
      const emitEvent = jest.spyOn(watcher, "emit");
      //Act
      watcher.handleChangeStreamClosed();

      //Assert
      expect(emitEvent).toHaveBeenCalledWith(WatcherEvent.CLOSE, "Change stream is CLOSED");
    });
  });
});
