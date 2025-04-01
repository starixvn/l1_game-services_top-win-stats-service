import { GameConfig } from "../types";
import { logger } from "sc-common";

export const TIME_FRAMES = {
  MONTHLY: "monthly",
  YEARLY: "yearly",
} as const;

export type TimeFrame = (typeof TIME_FRAMES)[keyof typeof TIME_FRAMES];

export interface TimeFrameResults<T> {
  [TIME_FRAMES.MONTHLY]: T[];
  [TIME_FRAMES.YEARLY]: T[];
}

export abstract class BaseTopHandler<T> {
  protected topResults: { [key: string]: TimeFrameResults<T> } = {};
  protected readonly MAX_TOP_RESULTS = 50;

  async loadTopResults(gameConfigs: Array<GameConfig>): Promise<void> {
    try {
      await Promise.all(gameConfigs.map((game) => this.loadGameTopResults(game)));
    } catch (err) {
      logger.logError("Failed to load top results:", err);
    }
  }

  protected async loadGameTopResults(game: GameConfig): Promise<void> {
    const [monthly, yearly] = await Promise.all([
      this.fetchTimeframeResults(game.name, TIME_FRAMES.MONTHLY),
      this.fetchTimeframeResults(game.name, TIME_FRAMES.YEARLY),
    ]);

    this.topResults[game.id] = {
      [TIME_FRAMES.MONTHLY]: monthly,
      [TIME_FRAMES.YEARLY]: yearly,
    };
  }

  protected async ensureTopResultsInitialized(gameId: string): Promise<void> {
    if (!this.topResults[gameId]) {
      this.topResults[gameId] = {
        [TIME_FRAMES.MONTHLY]: [],
        [TIME_FRAMES.YEARLY]: [],
      };
    }
  }

  protected getDateLimit(timeFrame: TimeFrame): Date {
    const date = new Date();
    if (timeFrame === TIME_FRAMES.MONTHLY) {
      date.setMonth(date.getMonth() - 1);
    } else {
      date.setFullYear(date.getFullYear() - 1);
    }
    return date;
  }

  protected abstract fetchTimeframeResults(gameConfigName: string, timeFrame: TimeFrame): Promise<T[]>;

  getMonthlyTopResults(gameId: string): T[] {
    return this.getTimeframeResults(gameId, TIME_FRAMES.MONTHLY);
  }

  getYearlyTopResults(gameId: string): T[] {
    return this.getTimeframeResults(gameId, TIME_FRAMES.YEARLY);
  }

  protected getTimeframeResults(gameId: string, timeFrame: TimeFrame): T[] {
    return this.topResults[gameId]?.[timeFrame] || [];
  }

  remove(gameId: string): void {
    delete this.topResults[gameId];
  }

  clear(): void {
    this.topResults = {};
  }
}
