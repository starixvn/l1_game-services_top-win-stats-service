import { GameRound } from "../models/game-rounds";
import { TopCashoutPoint, getTopCashoutPointCollection } from "../models/top-cashout-point";
import { getTempBetLogCollection, getBetLogCollection } from "../models/bet-logs";
import { gameResult, IResult } from "../models/result";
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

  constructor() {
    this.startCleanupInterval();
  }

  private startCleanupInterval() {
    const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000;
    setInterval(() => this.cleanupOldResults(), CLEANUP_INTERVAL);
  }

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

    if (updatedItems.length > 0) {
      results.push(...updatedItems);
      results.sort((a, b) => b.cashoutPoint - a.cashoutPoint);
      if (results.length > this.MAX_TOP_RESULTS) {
        results.splice(this.MAX_TOP_RESULTS, results.length - this.MAX_TOP_RESULTS);
      }
    }
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

  private async removeOutdatedRecords(timeFrame: TimeFrame, model: any, previousRounds: TopCashoutPoint[]): Promise<TopCashoutPoint[]> {
    const dateLimit = this.getDateLimit(timeFrame);

    await model.deleteMany({
      time: { $lt: dateLimit },
    });

    return previousRounds.filter((round) => round.time >= dateLimit);
  }

  private async cleanupOldRecords(
    timeFrame: TimeFrame,
    model: any,
    previousRounds: TopCashoutPoint[],
    numberOfItemsToRemove: number
  ): Promise<void> {
    previousRounds = await this.removeOutdatedRecords(timeFrame, model, previousRounds);

    if (previousRounds.length >= this.MAX_TOP_RESULTS) {
      const bottomResults = previousRounds.sort((a, b) => b.cashoutPoint - a.cashoutPoint).slice(-numberOfItemsToRemove);

      if (bottomResults.length > 0) {
        await model.deleteMany({
          roundId: { $in: bottomResults.map((r) => r.roundId) },
        });
      }
    }
  }

  private async updateTopCashout(
    gameConfigName: string,
    timeFrame: TimeFrame,
    newResults: TopCashoutPoint[],
    previousRounds: TopCashoutPoint[]
  ): Promise<TopCashoutPoint[]> {
    const combinedResults = [...previousRounds, ...newResults];
    combinedResults.sort((a, b) => b.cashoutPoint - a.cashoutPoint);

    const topResults = combinedResults.slice(0, this.MAX_TOP_RESULTS);

    const previousRoundIds = new Set(previousRounds.map((r) => r.roundId));
    const newItems = topResults.filter((result) => !previousRoundIds.has(result.roundId));

    if (newItems.length > 0) {
      const topCashoutPointModel = getTopCashoutPointCollection(gameConfigName, timeFrame);

      await this.cleanupOldRecords(timeFrame, topCashoutPointModel, previousRounds, newItems.length);

      await this.saveTopResult(gameConfigName, timeFrame, newItems, topCashoutPointModel);
    }

    return newItems;
  }

  private async saveTopResult(gameConfigName: string, timeFrame: TimeFrame, results: TopCashoutPoint[], model: any): Promise<void> {
    const roundId = results[0].roundId;
    const pf = await gameResult(gameConfigName).find({ roundId }, { _id: false, _v: false }).lean().exec();

    const newRecords = results.map((result) => ({
      ...result,
      provablyFair: pf,
    }));

    await model.insertMany(newRecords);
  }

  private cleanupOldResults(): void {
    Object.keys(this.topResults).forEach((gameId) => {
      Object.entries({
        [TIME_FRAMES.MONTHLY]: this.getDateLimit(TIME_FRAMES.MONTHLY),
        [TIME_FRAMES.YEARLY]: this.getDateLimit(TIME_FRAMES.YEARLY),
      }).forEach(([timeFrame, dateLimit]) => {
        this.topResults[gameId][timeFrame as TimeFrame] = this.topResults[gameId][timeFrame as TimeFrame].filter(
          (r) => r.time >= dateLimit
        );
      });
    });
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
