import { Document } from "bson";
import EventEmitter from "events";
import { ChangeStream, ChangeStreamDocument, ChangeStreamInsertDocument, ChangeStreamOptions } from "mongodb";
import { Model } from "mongoose";
import { logger } from "sc-common";
import { OperationType } from "../constants";
import getGameRoundModel, { GameRound } from "../models/game-rounds";
import { GameConfig } from "../types";

export default class RoundBaseGameWatcher extends EventEmitter {
  private readonly gameConfig: GameConfig;
  private readonly model: Model<GameRound>;
  private changeStream: ChangeStream<GameRound>;

  constructor(gameConfig: GameConfig) {
    super();
    this.gameConfig = gameConfig;
    this.model = getGameRoundModel(gameConfig.name);
    this.initChangeStream();
  }

  private initChangeStream(pipeline: Document[] = [], options: ChangeStreamOptions = {}) {
    this.changeStream = this.model.watch(pipeline, options);
    this.registerEvents();
  }

  private registerEvents() {
    this.changeStream.on(ChangeStream.CHANGE, (event) => this.handleChangeStreamChange(event));
    this.changeStream.on(ChangeStream.CLOSE, () => this.handleChangeStreamClosed());
    this.changeStream.on(ChangeStream.ERROR, (error: Error) => this.handleChangeStreamError(error));
  }

  handleChangeStreamChange(data: ChangeStreamDocument<GameRound>) {
    const { operationType } = data;
    if (operationType === OperationType.INSERT) {
      const { fullDocument } = data as ChangeStreamInsertDocument<GameRound>;
      const { id, result, settlementResult, time } = fullDocument;
      const newRound = { [this.gameConfig.id]: { id, result, settlementResult, time } };
      this.emit(WatcherEvent.NEWROUND, newRound);
    }
  }

  handleChangeStreamError(error: Error) {
    console.log(error);
    logger.logError(error);
  }

  handleChangeStreamClosed() {
    console.log(`Change Stream for ${this.gameConfig.name} has been closed!!`);
    logger.logWarning(`Change Stream for ${this.gameConfig.name} has been closed!!`);
  }

  async closeChangeStream() {
    this.changeStream.removeAllListeners();
    await this.changeStream.close();
  }
}

export class WatcherEvent {
  static readonly CLOSE: "close";
  static readonly NEWROUND: "newround";
  static readonly ERROR: "error";
}
