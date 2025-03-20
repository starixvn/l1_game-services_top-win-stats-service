import { getSupportedGames } from "../constants";
import WatcherManager from "../watchers/watcher-manager";

export default class AppBoostrapHandler {
  private readonly watcherManager: WatcherManager;

  constructor(watcherManager: WatcherManager) {
    this.watcherManager = watcherManager;
  }

  public async initWatcher() {
    const supportedGames = getSupportedGames();

    await this.watcherManager.loadLatestTopResults();
    supportedGames.forEach((game) => this.watcherManager.addWatcher(game));
  }
}
