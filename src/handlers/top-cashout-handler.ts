import { GameRound } from "../models/game-rounds";
import { TopCashoutPoint, getTopCashoutPointCollection } from "../models/top-cashout-point";
import { getTempBetLogCollection, getBetLogCollection } from "../models/bet-logs";
import { BaseTopHandler, TimeFrame, TIME_FRAMES } from "./base-top-handler";
import { logger } from "sc-common";
import { getSupportedGames } from "../constants";
import { gameResult, IResult } from "../models/result";

export class TopCashoutHandler extends BaseTopHandler<TopCashoutPoint> {
  async updateTopResults(gameId: string, round: GameRound): Promise<void> {
    try {
      const gameName = getSupportedGames().find((g) => g.id === +gameId)?.name;
      if (!gameName) return;

      await this.ensureTopResultsInitialized(gameId);
      const cashoutPoints = await this.getCashoutPoints(gameName, round);
      await this.updateTimeframes(gameName, gameId, cashoutPoints);
    } catch (err) {
      logger.logError(`Failed to update top results for gameId ${gameId}:`, err);
    }
  }

  protected async fetchTimeframeResults(gameConfigName: string, timeFrame: TimeFrame): Promise<TopCashoutPoint[]> {
    const fromDate = this.getDateLimit(timeFrame);
    const topCashoutPoints = getTopCashoutPointCollection(gameConfigName, timeFrame);

    return topCashoutPoints
      .find({ time: { $gte: fromDate } }, { _id: false, _v: false })
      .sort({ cashoutPoint: -1 })
      .limit(this.MAX_TOP_RESULTS)
      .lean()
      .exec();
  }

  private async getCashoutPoints(gameName: string, round: GameRound): Promise<TopCashoutPoint[]> {
    const [cashOutLogs, tempCashoutLogs] = await Promise.all([
      getBetLogCollection(gameName).find({ roundId: round.id, action: "cashOut" }, { _id: false, _v: false }).lean().exec(),
      getTempBetLogCollection(gameName).find({ roundId: round.id, action: "cashOut" }, { _id: false, _v: false }).lean().exec(),
    ]);

    return [...cashOutLogs, ...tempCashoutLogs].map(
      (log) =>
        ({
          cashoutPoint: log.multiplier,
          crashPoint: round.result,
          uid: log.uid,
          name: log.name,
          operatorId: log.operatorId,
          currency: log.currency,
          time: log.time,
          roundId: log.roundId,
          betAmount: log.amount,
          winAmount: log.winAmount,
          rate: log.rate,
        } as TopCashoutPoint)
    );
  }

  private async updateTimeframes(gameConfigName: string, gameId: string, newResults: TopCashoutPoint[]): Promise<void> {
    await Promise.all([
      this.updateTimeframe(gameConfigName, TIME_FRAMES.MONTHLY, gameId, newResults),
      this.updateTimeframe(gameConfigName, TIME_FRAMES.YEARLY, gameId, newResults),
    ]);
  }

  private async updateTimeframe(
    gameConfigName: string,
    timeFrame: TimeFrame,
    gameId: string,
    newResults: TopCashoutPoint[]
  ): Promise<void> {
    const results = this.topResults[gameId][timeFrame];
    const updatedItems = await this.updateTopCashout(gameConfigName, timeFrame, newResults, results);
    this.topResults[gameId][timeFrame] = updatedItems;
  }

  private async updateTopCashout(
    gameConfigName: string,
    timeFrame: TimeFrame,
    newCashOutPoints: TopCashoutPoint[],
    currentTopCashOutPoints: TopCashoutPoint[]
  ): Promise<TopCashoutPoint[]> {
    const combinedResults = [...currentTopCashOutPoints, ...newCashOutPoints];
    const newTopResults = combinedResults
      .filter((result) => result.time >= this.getDateLimit(timeFrame))
      .sort((a, b) => b.cashoutPoint - a.cashoutPoint)
      .slice(0, this.MAX_TOP_RESULTS);

    const addItems = newTopResults.filter(
      (result) =>
        !currentTopCashOutPoints.some((r) => r.roundId === result.roundId && r.cashoutPoint === result.cashoutPoint && r.uid === result.uid)
    );
    const removeItems = currentTopCashOutPoints.filter(
      (result) => !newTopResults.some((r) => r.roundId === result.roundId && r.cashoutPoint === result.cashoutPoint && r.uid === result.uid)
    );

    await this.updateTopCashoutDB(gameConfigName, timeFrame, addItems, removeItems);

    return newTopResults;
  }

  private async updateTopCashoutDB(
    gameConfigName: string,
    timeFrame: TimeFrame,
    addItems: TopCashoutPoint[],
    removeItems: TopCashoutPoint[]
  ): Promise<void> {
    if (!addItems.length && !removeItems.length) return;

    const topCashoutPointModel = getTopCashoutPointCollection(gameConfigName, timeFrame);
    const roundId = addItems[0]?.roundId;

    if (addItems.length > 0) {
      const pf = (await gameResult(gameConfigName).findOne({ roundId }, { _id: false, _v: false }).lean().exec()) as IResult;
      addItems.forEach((item) => (item.provablyFair = pf));
      await topCashoutPointModel.insertMany(addItems);
    }

    if (removeItems.length > 0) {
      await topCashoutPointModel.deleteMany({
        $or: removeItems.map((item) => ({
          roundId: item.roundId,
          uid: item.uid,
          cashoutPoint: item.cashoutPoint,
        })),
      });
    }
  }
}
