import { GameRound } from "../models/game-rounds";
import RoundBaseGameWatcher, { WatcherEvent } from "../watchers/round-base-game-watcher";
import { TopResultsHandler } from "./top-result-handler";

export default class WatcherEventHandler {
  private readonly topResultsHandler: TopResultsHandler;
  constructor(topResultsHandler: TopResultsHandler) {
    this.topResultsHandler = topResultsHandler;

    this.handleNewRoundEvent = this.handleNewRoundEvent.bind(this);
  }

  attachListeners(watcher: RoundBaseGameWatcher) {
    watcher.on(WatcherEvent.NEWROUND, this.handleNewRoundEvent);
  }

  async handleNewRoundEvent(newRound: { [key: string]: GameRound }) {
    this.topResultsHandler.updateTopResults(Object.keys(newRound)[0], Object.values(newRound)[0]);
  }
}
