import mongoose, { Document, Schema } from "mongoose";
import { getResultCollection } from "../constants";

export interface IResult extends Document {
  roundId: number;
  serverSeed?: string;
  serverSeedHash?: string;
  clientSeeds: string[];
  mergeClientSeed?: string;
  mergeSeed?: string;
  finalHash?: string;
  time: Date;
}

const resultSchema = new Schema({
  roundId: { type: Number, required: true },
  serverSeed: { type: String },
  serverSeedHash: { type: String },
  clientSeeds: { type: Array, default: [] },
  mergeClientSeed: { type: String },
  mergeSeed: { type: String },
  finalHash: { type: String },
  time: { type: Date, default: new Date() },
});

const gameResult = (gameConfigName: string) => mongoose.model<IResult>(getResultCollection(gameConfigName), resultSchema);

export { gameResult };
