import { GameRound } from "../models/game-rounds";
import { TopGameRound, getTopRoundCollection } from "../models/top-round-results";
import { BaseTopHandler, TimeFrame, TIME_FRAMES } from "./base-top-handler";
import { logger } from "sc-common";
import { getSupportedGames } from "../constants";
import { gameResult } from "../models/result";

export class TopResultsHandler extends BaseTopHandler<TopGameRound> {
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

  protected async fetchTimeframeResults(gameConfigName: string, timeFrame: TimeFrame): Promise<TopGameRound[]> {
    const fromDate = this.getDateLimit(timeFrame);
    const topRounds = getTopRoundCollection(gameConfigName, timeFrame);

    return topRounds
      .find({ time: { $gte: fromDate } }, { _id: false, _v: false })
      .sort({ result: -1 })
      .limit(this.MAX_TOP_RESULTS)
      .lean()
      .exec();
  }

  private convertToTopRound(round: GameRound): TopGameRound {
    return {
      id: round.id,
      result: round.result,
      time: round.time,
    } as TopGameRound;
  }

  private async updateTimeframes(gameConfigName: string, gameId: string, newResult: TopGameRound): Promise<void> {
    await Promise.all([
      this.updateTimeframe(gameConfigName, TIME_FRAMES.MONTHLY, gameId, newResult),
      this.updateTimeframe(gameConfigName, TIME_FRAMES.YEARLY, gameId, newResult),
    ]);
  }

  private async updateTimeframe(gameConfigName: string, timeFrame: TimeFrame, gameId: string, newResult: TopGameRound): Promise<void> {
    const results = this.topResults[gameId][timeFrame];
    const updatedItems = await this.updateTopResult(gameConfigName, timeFrame, newResult, results);
    this.topResults[gameId][timeFrame] = updatedItems;
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

    const addItem = newTopResults.find((r) => r.id === newResult.id);
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
}
