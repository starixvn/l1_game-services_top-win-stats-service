import { GameRound } from "../models/game-rounds";
import { TopGameRound, getTopRoundCollection } from "../models/top-round-results";
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
  [TIME_FRAMES.MONTHLY]: TopGameRound[];
  [TIME_FRAMES.YEARLY]: TopGameRound[];
}

export class TopResultsHandler {
  private topResults: { [key: string]: TimeFrameResults } = {};
  private readonly MAX_TOP_RESULTS = 50;

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

      await this.updateTimeframes(gameName, gameId, topRound);
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

  private async updateTimeframes(gameConfigName: string, gameId: string, newResult: TopGameRound): Promise<void> {
    await Promise.all([
      this.updateTimeframe(gameConfigName, TIME_FRAMES.MONTHLY, gameId, newResult),
      this.updateTimeframe(gameConfigName, TIME_FRAMES.YEARLY, gameId, newResult),
    ]);
  }

  private async updateTimeframe(gameConfigName: string, timeFrame: TimeFrame, gameId: string, newResult: TopGameRound): Promise<void> {
    const results = this.topResults[gameId][timeFrame];

    this.topResults[gameId][timeFrame] = await this.updateTopResult(gameConfigName, timeFrame, newResult, results);
  }

  private async fetchTimeframeResults(gameConfigName: string, timeFrame: TimeFrame): Promise<TopGameRound[]> {
    const fromDate = this.getDateLimit(timeFrame);
    const topRounds = getTopRoundCollection(gameConfigName, timeFrame);

    const rounds = await topRounds
      .find({ time: { $gte: fromDate } }, { _id: false, _v: false })
      .sort({ result: -1 })
      .limit(this.MAX_TOP_RESULTS)
      .lean()
      .exec();

    return rounds;
  }

  private convertToTopRound(round: GameRound): TopGameRound {
    return {
      id: round.id,
      result: round.result,
      time: round.time,
    } as TopGameRound;
  }

  private async updateTopResult(
    gameConfigName: string,
    timeFrame: TimeFrame,
    newResult: TopGameRound,
    previousRounds: TopGameRound[]
  ): Promise<TopGameRound[]> {
    const newTopResults = [...previousRounds, newResult]
      .filter((result) => result.time >= this.getDateLimit(timeFrame))
      .sort((a, b) => b.result - a.result)
      .slice(0, this.MAX_TOP_RESULTS);

    const addItem = newTopResults.find((r) => r.id == newResult.id);
    const removeItems = previousRounds.filter((r) => !newTopResults.includes(r));

    await this.updateTopRoundDB(gameConfigName, timeFrame, addItem, removeItems);

    return newTopResults;
  }

  private async updateTopRoundDB(
    gameConfigName: string,
    timeFrame: TimeFrame,
    addItem: TopGameRound | undefined,
    removeItems: TopGameRound[]
  ): Promise<void> {
    const topRoundModel = getTopRoundCollection(gameConfigName, timeFrame);

    if (addItem) {
      const pf = await gameResult(gameConfigName).find({ roundId: addItem?.id }, { _id: false, _v: false }).lean().exec();
      await topRoundModel.create({ ...addItem, provablyFair: pf });
    }

    if (removeItems.length > 0) {
      await topRoundModel.deleteMany({
        $or: removeItems.map((item) => ({
          id: item.id,
        })),
      });
    }
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
    return this.topResults[gameId]?.[timeFrame] || [];
  }

  remove(gameId: string): void {
    delete this.topResults[gameId];
  }

  clear(): void {
    this.topResults = {};
  }
}
