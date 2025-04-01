import { GameRound } from "../models/game-rounds";
import { TopCashoutPoint, getTopCashoutPointCollection } from "../models/top-cashout-point";
import { getTempBetLogCollection, getBetLogCollection } from "../models/bet-logs";
import { gameResult } from "../models/result";
import { GameConfig } from "../types";
import { logger } from "sc-common";
import { getSupportedGames } from "../constants";

const TIME_FRAMES = {
  MONTHLY: "monthly",
  YEARLY: "yearly",
} as const;

type TimeFrame = (typeof TIME_FRAMES)[keyof typeof TIME_FRAMES];

interface TimeFrameResults {
  [TIME_FRAMES.MONTHLY]: TopCashoutPoint[];
  [TIME_FRAMES.YEARLY]: TopCashoutPoint[];
}

export class TopCashoutHandler {
  private topResults: { [key: string]: TimeFrameResults } = {};
  private readonly MAX_TOP_RESULTS = 50;

  async loadTopCashout(gameConfigs: Array<GameConfig>): Promise<void> {
    try {
      await Promise.all(gameConfigs.map((game) => this.loadTopCashoutPoints(game)));
    } catch (err) {
      logger.logError("Failed to load top results:", err);
    }
  }

  private async loadTopCashoutPoints(game: GameConfig): Promise<void> {
    const [monthly, yearly] = await Promise.all([
      this.fetchTimeframeResults(game.name, TIME_FRAMES.MONTHLY),
      this.fetchTimeframeResults(game.name, TIME_FRAMES.YEARLY),
    ]);

    this.topResults[game.id] = {
      [TIME_FRAMES.MONTHLY]: monthly,
      [TIME_FRAMES.YEARLY]: yearly,
    };
  }

  async updateTopResults(gameId: string, round: GameRound): Promise<void> {
    try {
      const gameName = getSupportedGames().find((g) => g.id === +gameId)?.name;
      if (!gameName) return;

      await this.ensureTopResultsInitialized(gameId);

      const cashOutLogs = await getBetLogCollection(gameName)
        .find(
          {
            roundId: round.id,
            action: "cashOut",
          },
          { _id: false, _v: false }
        )
        .lean()
        .exec();

      const tempCashoutLogs = await getTempBetLogCollection(gameName)
        .find(
          {
            roundId: round.id,
            action: "cashOut",
          },
          { _id: false, _v: false }
        )
        .lean()
        .exec();

      const topCashoutPoint = [...cashOutLogs, ...tempCashoutLogs].map((log) => ({
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
      })) as TopCashoutPoint[];

      await this.updateTimeframes(gameName, gameId, topCashoutPoint);
    } catch (err) {
      logger.logError(`Failed to update top results for gameId ${gameId}:`, err);
    }
  }

  private async ensureTopResultsInitialized(gameId: string): Promise<void> {
    if (!this.topResults[gameId]) {
      this.topResults[gameId] = {
        [TIME_FRAMES.MONTHLY]: [],
        [TIME_FRAMES.YEARLY]: [],
      };
    }
  }

  private async updateTimeframes(gameConfigName: string, gameId: string, newResult: TopCashoutPoint[]): Promise<void> {
    await Promise.all([
      this.updateTimeframe(gameConfigName, TIME_FRAMES.MONTHLY, gameId, newResult),
      this.updateTimeframe(gameConfigName, TIME_FRAMES.YEARLY, gameId, newResult),
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

  private async fetchTimeframeResults(gameConfigName: string, timeFrame: TimeFrame): Promise<TopCashoutPoint[]> {
    const fromDate = this.getDateLimit(timeFrame);
    const topCashoutPoints = getTopCashoutPointCollection(gameConfigName, timeFrame);

    const cashoutPoints = await topCashoutPoints
      .find({ time: { $gte: fromDate } }, { _id: false, _v: false })
      .sort({ cashoutPoint: -1 })
      .limit(this.MAX_TOP_RESULTS)
      .lean()
      .exec();

    return cashoutPoints as TopCashoutPoint[];
  }

  private async updateTopCashoutDB(
    gameConfigName: string,
    timeFrame: TimeFrame,
    addItems: TopCashoutPoint[],
    removeItems: TopCashoutPoint[]
  ): Promise<void> {
    const topCashoutPointModel = getTopCashoutPointCollection(gameConfigName, timeFrame);
    const roundId = addItems[0].roundId;
    const pf = await gameResult(gameConfigName).find({ roundId }, { _id: false, _v: false }).lean().exec();

    await topCashoutPointModel.insertMany(addItems.map((item) => ({ ...item, provablyFair: pf })));

    await topCashoutPointModel.deleteMany({
      $or: removeItems.map((item) => ({
        roundId: item.roundId,
        uid: item.uid,
        cashoutPoint: item.cashoutPoint,
      })),
    });
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

  private getDateLimit(timeFrame: TimeFrame): Date {
    const date = new Date();
    if (timeFrame === TIME_FRAMES.MONTHLY) {
      date.setMonth(date.getMonth() - 1);
    } else {
      date.setFullYear(date.getFullYear() - 1);
    }
    return date;
  }

  getMonthlyTopCashout(gameId: string): TopCashoutPoint[] {
    return this.getTimeframeResults(gameId, TIME_FRAMES.MONTHLY);
  }

  getYearlyTopCashout(gameId: string): TopCashoutPoint[] {
    return this.getTimeframeResults(gameId, TIME_FRAMES.YEARLY);
  }

  private getTimeframeResults(gameId: string, timeFrame: TimeFrame): TopCashoutPoint[] {
    return this.topResults[gameId]?.[timeFrame] || [];
  }

  remove(gameId: string): void {
    delete this.topResults[gameId];
  }

  clear(): void {
    this.topResults = {};
  }
}
