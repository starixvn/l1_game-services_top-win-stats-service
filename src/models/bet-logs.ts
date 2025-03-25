import mongoose, { Document, Schema } from "mongoose";
import { getBetLogCollectionName, getTempBetLogCollectionName } from "../constants";

export interface IBetLog extends Document {
  uid: string;
  name: string;
  action?: string;
  amount: number;
  winAmount: number;
  multiplier: number;
  receivedTime: Date;
  reachMaxWin: boolean;
  autoCashOut?: number;
  clientSeed?: string;
  time?: Date;
  clientSendTime?: Date;
  betKey?: number;
  siteId?: string;
  currency: string;
  rate: number;
  playerId?: string;
  operatorId: string;
  roundId: number;
}

const betLogSchema = new Schema({
  uid: { type: String, required: true },
  name: { type: String, required: true },
  action: { type: String },
  amount: { type: Number, default: 0 },
  winAmount: { type: Number, default: 0 },
  multiplier: { type: Number, default: 0 },
  receivedTime: { type: Date, required: true },
  reachMaxWin: { type: Boolean, default: false },
  autoCashOut: { type: Number },
  clientSeed: { type: String },
  time: { type: Date },
  clientSendTime: { type: Date },
  betKey: { type: Number },
  siteId: { type: String },
  currency: { type: String, required: true },
  rate: { type: Number, required: true },
  playerId: { type: String },
  operatorId: { type: String, required: true },
  roundId: { type: Number, default: 0, required: true },
});

const getTempBetLogCollection = (gameConfigName: string) =>
  mongoose.model<IBetLog>(getTempBetLogCollectionName(gameConfigName), betLogSchema);

const getBetLogCollection = (gameConfigName: string) => mongoose.model<IBetLog>(getBetLogCollectionName(gameConfigName), betLogSchema);

export { getTempBetLogCollection, getBetLogCollection };
