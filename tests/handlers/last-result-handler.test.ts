import { gameRounds } from "../../src/models";
import { logger } from "sc-common";
import LastResultHandler from "../../src/handlers/last-result-handler";

jest.mock("sc-common");
jest.mock("../../src/models", () => ({
  gameRounds: jest.fn(),
}));

describe("LastResultHandler", () => {
  let lastResultHandler;

  beforeEach(() => {
    lastResultHandler = new LastResultHandler();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getLastResult", () => {
    const exec = jest.fn().mockResolvedValue({ id: 123 });

    const rounds = {
      findOne: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: () => ({
            exec,
          }),
        }),
      }),
    };

    beforeEach(() => {
      (gameRounds as jest.Mock).mockReturnValue(rounds);
    });

    it("should get the last result for each game config", async () => {
      // Arrange
      const gameConfigs = [
        { id: "game1", name: "Game 1" },
        { id: "game2", name: "Game 2" },
        { id: "game3", name: "Game 3" },
      ];

      // Act
      await lastResultHandler.getLastResult(gameConfigs);

      // Assert
      expect(gameRounds).toHaveBeenCalledWith(gameConfigs[0].name);
      expect(gameRounds).toHaveBeenCalledWith(gameConfigs[1].name);
      expect(gameRounds).toHaveBeenCalledWith(gameConfigs[2].name);

      expect(rounds.findOne).toHaveBeenCalledWith({}, { _id: false, exchangeRateId: false });
      expect(rounds.findOne().sort).toHaveBeenCalledWith({ id: -1 });
      expect(exec).toHaveBeenCalledTimes(3);

      expect(lastResultHandler.lastResult).toEqual({
        game1: { id: 123 },
        game2: { id: 123 },
        game3: { id: 123 },
      });
    });

    it("should log error when an error occurs", async () => {
      // Arrange
      const gameConfigs = [{ id: "game1", name: "Game 1" }];
      const error = new Error("Something went wrong");
      exec.mockRejectedValueOnce(error);

      // Act
      await lastResultHandler.getLastResult(gameConfigs);

      // Assert
      expect(logger.logError).toHaveBeenCalledWith(error);
    });
  });

  describe("update", () => {
    it("should update the last result with the given round result", () => {
      // Arrange
      lastResultHandler.lastResult = {
        game1: { id: 123 },
        game2: { id: 456 },
      };

      const roundResult = {
        game1: { id: 789 },
        game3: { id: 987 },
      };

      // Act
      lastResultHandler.update(roundResult);

      // Assert
      expect(lastResultHandler.lastResult).toEqual({
        game1: { id: 789 },
        game2: { id: 456 },
        game3: { id: 987 },
      });
    });
  });

  describe("get", () => {
    it("should return a copy of the last result", () => {
      // Arrange
      lastResultHandler.lastResult = {
        game1: { id: 123 },
        game2: { id: 456 },
      };

      // Act
      const result = lastResultHandler.get();

      // Assert
      expect(result).toEqual({
        game1: { id: 123 },
        game2: { id: 456 },
      });
    });
  });

  describe("remove", () => {
    it("should remove the last result with the given key", () => {
      // Arrange
      lastResultHandler.lastResult = {
        game1: { id: 123 },
        game2: { id: 456 },
      };

      // Act
      lastResultHandler.remove("game2");

      // Assert
      expect(lastResultHandler.lastResult).toEqual({
        game1: { id: 123 },
      });
    });
  });

  describe("clear", () => {
    it("should clear the last result", () => {
      // Arrange
      lastResultHandler.lastResult = {
        game1: { id: 123 },
        game2: { id: 456 },
      };

      // Act
      lastResultHandler.clear();

      // Assert
      expect(lastResultHandler.lastResult).toEqual({});
    });
  });
});
