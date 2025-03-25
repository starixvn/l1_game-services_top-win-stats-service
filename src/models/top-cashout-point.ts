import mongoose, { Document, Schema } from "mongoose";
import { getTopCashoutPointCollectionName } from "../constants";
import { IResult } from "./result";

export interface TopCashoutPoint extends Document {
  cashoutPoint: number;
  crashPoint: number;
  uid: string;
  name: string;
  operatorId: string;
  currency: string;
  time: Date;
  roundId: number;
  provablyFair?: IResult;
}

const topCashoutPointSchema = new Schema<TopCashoutPoint>({
  cashoutPoint: { type: Number, required: true },
  crashPoint: { type: Number, required: true },
  uid: { type: String, required: true },
  name: { type: String, required: true },
  operatorId: { type: String, required: true },
  currency: { type: String, required: true },
  time: { type: Date, required: true },
  roundId: { type: Number, required: true },
  provablyFair: { type: Object },
});

export const getTopCashoutPointCollection = (gameConfigName: string, timeFrame: string) =>
  mongoose.model<TopCashoutPoint>(getTopCashoutPointCollectionName(gameConfigName, timeFrame), topCashoutPointSchema);
