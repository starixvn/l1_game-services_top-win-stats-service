import { getSupportedGames } from "../constants";
import { TopResultsHandler } from "../handlers/top-result-handler";
import { TopCashoutHandler } from "../handlers/top-cashout-handler";
import WatcherEventHandler from "../handlers/watcher-event-handler";
import { GameConfig } from "../types";
import RoundBaseGameWatcher from "./round-base-game-watcher";

export default class WatcherManager {
  private readonly watchers: { [key: string]: RoundBaseGameWatcher } = {};
  private readonly watcherEventHandler: WatcherEventHandler;
  private readonly topResultsHandler: TopResultsHandler;
  private readonly topCashoutHandler: TopCashoutHandler;

  constructor(watcherEventHandler: WatcherEventHandler, topResultsHandler: TopResultsHandler, topCashoutHandler: TopCashoutHandler) {
    this.watcherEventHandler = watcherEventHandler;
    this.topResultsHandler = topResultsHandler;
    this.topCashoutHandler = topCashoutHandler;
  }

  addWatcher(game: GameConfig) {
    if (!this.watchers[game.id]) {
      const watcher = new RoundBaseGameWatcher(game);

      this.watchers[game.id] = watcher;
      this.watcherEventHandler.attachListeners(watcher);
    }
  }

  async getMonthlyTopResults(gameId: string) {
    return this.topResultsHandler.getMonthlyTopResults(gameId);
  }

  async getYearlyTopResults(gameId: string) {
    return this.topResultsHandler.getYearlyTopResults(gameId);
  }

  async getMonthlyTopCashout(gameId: string) {
    return this.topCashoutHandler.getMonthlyTopCashout(gameId);
  }

  async getYearlyTopCashout(gameId: string) {
    return this.topCashoutHandler.getYearlyTopCashout(gameId);
  }

  async loadLatestTopResults() {
    const supportedGames = getSupportedGames();
    await this.topResultsHandler.loadTopResults(supportedGames);
  }

  async loadLatestTopCashout() {
    const supportedGames = getSupportedGames();
    await this.topCashoutHandler.loadTopCashout(supportedGames);
  }

  async removeWatcher(gameId: string) {
    await this.watchers[gameId].closeChangeStream();
    delete this.watchers[gameId];
  }

  async removeAllWatchers() {
    await Promise.all(Object.keys(this.watchers).map((key) => this.removeWatcher(key)));
  }
}
