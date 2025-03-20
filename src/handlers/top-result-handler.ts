import { GameRound } from "../models/game-rounds";
import { TopGameRound, getTopRoundCollection } from "../models/top-round-results";
import { gameResult, IResult } from "../models/result";
import { GameConfig } from "../types";
import { logger } from "sc-common";
import { getSupportedGames } from "../constants";

const TIME_FRAMES = {
  MONTHLY: "monthly",
  YEARLY: "yearly",
} as const;

type TimeFrame = (typeof TIME_FRAMES)[keyof typeof TIME_FRAMES];

interface TopResult {
  result: TopGameRound;
  timestamp: Date;
}

interface TimeFrameResults {
  [TIME_FRAMES.MONTHLY]: TopResult[];
  [TIME_FRAMES.YEARLY]: TopResult[];
}

export class TopResultsHandler {
  private topResults: { [key: string]: TimeFrameResults } = {};
  private readonly MAX_TOP_RESULTS = 50;

  constructor() {
    this.startCleanupInterval();
  }

  private startCleanupInterval() {
    const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000;
    setInterval(() => this.cleanupOldResults(), CLEANUP_INTERVAL);
  }

  async loadTopResults(gameConfigs: Array<GameConfig>): Promise<void> {
    try {
      await Promise.all(gameConfigs.map((game) => this.loadGameTopResults(game)));
    } catch (err) {
      logger.logError("Failed to load top results:", err);
    }
  }

  private async loadGameTopResults(game: GameConfig): Promise<void> {
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

      const topRound = this.convertToTopRound(round);
      const newTopResult = this.createTopResult(topRound);

      await this.updateTimeframes(gameName, gameId, newTopResult);
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

  private async updateTimeframes(gameConfigName: string, gameId: string, newResult: TopResult): Promise<void> {
    await Promise.all([
      this.updateTimeframe(gameConfigName, TIME_FRAMES.MONTHLY, gameId, newResult),
      this.updateTimeframe(gameConfigName, TIME_FRAMES.YEARLY, gameId, newResult),
    ]);
  }

  private async updateTimeframe(gameConfigName: string, timeFrame: TimeFrame, gameId: string, newResult: TopResult): Promise<void> {
    const results = this.topResults[gameId][timeFrame];
    const wasUpdated = await this.updateTopResult(
      gameConfigName,
      timeFrame,
      newResult,
      results.map((r) => r.result)
    );

    if (wasUpdated) {
      results.push(newResult);
      results.sort((a, b) => b.result.result - a.result.result);
      if (results.length > this.MAX_TOP_RESULTS) {
        results.pop();
      }
    }
  }

  private async fetchTimeframeResults(gameConfigName: string, timeFrame: TimeFrame): Promise<TopResult[]> {
    const fromDate = this.getDateLimit(timeFrame);
    const topRounds = getTopRoundCollection(gameConfigName, timeFrame);

    const rounds = await topRounds
      .find({ time: { $gte: fromDate } }, { _id: false, _v: false })
      .sort({ result: -1 })
      .limit(this.MAX_TOP_RESULTS)
      .lean()
      .exec();

    return rounds.map((round) => this.createTopResult(round));
  }

  private convertToTopRound(round: GameRound): TopGameRound {
    return {
      id: round.id,
      result: round.result,
      time: round.time,
    } as TopGameRound;
  }

  private createTopResult(round: TopGameRound): TopResult {
    return {
      result: round,
      timestamp: new Date(),
    };
  }

  private async updateTopResult(
    gameConfigName: string,
    timeFrame: TimeFrame,
    newResult: TopResult,
    previousRounds: TopGameRound[]
  ): Promise<boolean> {
    const position = previousRounds.findIndex((r) => r.result <= newResult.result.result);

    if (previousRounds.length < this.MAX_TOP_RESULTS || position !== -1) {
      try {
        await this.saveTopResult(gameConfigName, timeFrame, newResult.result, previousRounds);
        return true;
      } catch (err) {
        logger.logError(`Failed to update top-round-${timeFrame}:`, err);
        return false;
      }
    }
    return false;
  }

  private async saveTopResult(
    gameConfigName: string,
    timeFrame: TimeFrame,
    newRound: TopGameRound,
    previousRounds: TopGameRound[]
  ): Promise<void> {
    const topRoundModel = getTopRoundCollection(gameConfigName, timeFrame);
    const fullResult = await gameResult(gameConfigName).findOne({ roundId: newRound.id }, { _id: false, _v: false }).lean().exec();
    newRound.provablyFair = fullResult as IResult;

    await this.cleanupOldRecords(timeFrame, topRoundModel, previousRounds);
    await topRoundModel.create(newRound);
  }

  private async cleanupOldRecords(timeFrame: TimeFrame, model: any, previousRounds: TopGameRound[]): Promise<void> {
    const timeLimit = this.getDateLimit(timeFrame);
    await model.deleteMany({ time: { $lt: timeLimit } });

    const currentCount = await model.countDocuments();
    if (currentCount >= this.MAX_TOP_RESULTS) {
      const lastRound = previousRounds[this.MAX_TOP_RESULTS - 1];
      await model.deleteOne({ id: lastRound.id });
    }
  }

  private cleanupOldResults(): void {
    Object.keys(this.topResults).forEach((gameId) => {
      Object.entries({
        [TIME_FRAMES.MONTHLY]: this.getDateLimit(TIME_FRAMES.MONTHLY),
        [TIME_FRAMES.YEARLY]: this.getDateLimit(TIME_FRAMES.YEARLY),
      }).forEach(([timeFrame, dateLimit]) => {
        this.topResults[gameId][timeFrame as TimeFrame] = this.topResults[gameId][timeFrame as TimeFrame].filter(
          (r) => r.timestamp >= dateLimit
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

  getMonthlyTopResults(gameId: string): TopGameRound[] {
    return this.getTimeframeResults(gameId, TIME_FRAMES.MONTHLY);
  }

  getYearlyTopResults(gameId: string): TopGameRound[] {
    return this.getTimeframeResults(gameId, TIME_FRAMES.YEARLY);
  }

  private getTimeframeResults(gameId: string, timeFrame: TimeFrame): TopGameRound[] {
    return (this.topResults[gameId]?.[timeFrame] || []).map((tr) => tr.result);
  }

  remove(gameId: string): void {
    delete this.topResults[gameId];
  }

  clear(): void {
    this.topResults = {};
  }
}
