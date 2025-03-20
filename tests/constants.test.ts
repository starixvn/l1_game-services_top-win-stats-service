import { getRoundCollection, OperationType } from "../src/constants";

describe("getRoundCollection", () => {
  it("should return the correct round collection for a game with special mapping", () => {
    // Arrange
    const gameName = "oeturbo";
    const expectedCollection = "chanleturbo_phiens";

    // Act
    const collection = getRoundCollection(gameName);

    // Assert
    expect(collection).toEqual(expectedCollection);
  });

  it("should return the correct round collection for a game with old suffix mapping", () => {
    // Arrange
    const gameName = "texasholdempoker";
    const expectedCollection = "texasholdempoker_phiens";

    // Act
    const collection = getRoundCollection(gameName);

    // Assert
    expect(collection).toEqual(expectedCollection);
  });

  it("should return the correct round collection for a game without special or old suffix mapping", () => {
    // Arrange
    const gameName = "bingo";
    const expectedCollection = "bingo_rounds";

    // Act
    const collection = getRoundCollection(gameName);

    // Assert
    expect(collection).toEqual(expectedCollection);
  });
});

describe("OperationType", () => {
  it("should have the correct value for INSERT", () => {
    // Arrange
    const expectedValue = "insert";

    // Assert
    expect(OperationType.INSERT).toEqual(expectedValue);
  });
});
