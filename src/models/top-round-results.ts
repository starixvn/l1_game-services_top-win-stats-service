import mongoose, { Document, Schema } from "mongoose";
import { getTopRoundCollectionName } from "../constants";
import { IResult } from "./result";

export interface TopGameRound extends Document {
  id: number;
  result: number;
  time: Date;
  provablyFair?: IResult;
}

const topRoundSchema = new Schema<TopGameRound>({
  id: { type: Number, required: true },
  result: { type: Number, required: true },
  time: { type: Date, required: true },
  provablyFair: { type: Object },
});

export const getTopRoundCollection = (gameConfigName: string, timeFrame: string) =>
  mongoose.model<TopGameRound>(getTopRoundCollectionName(gameConfigName, timeFrame), topRoundSchema);
