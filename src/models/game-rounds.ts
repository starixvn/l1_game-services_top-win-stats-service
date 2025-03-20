import { Document } from "bson";
import mongoose from "mongoose";
import { getRoundCollection } from "../constants";

export interface GameRound extends Document {
  id: number;
  result: number;
  settlementResult: Object;
  time: Date;
}

const Schema = new mongoose.Schema<GameRound>({
  id: { type: Number, required: true },
  result: { type: Number },
  settlementResult: { type: Object },
  time: { type: Date },
});

export default (gameConfigName: string) => mongoose.model<GameRound>(getRoundCollection(gameConfigName), Schema);
