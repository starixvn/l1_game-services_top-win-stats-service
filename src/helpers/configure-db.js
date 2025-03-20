import mongoose from "mongoose";
import mongooseLong from "mongoose-long";
import { logger } from "sc-common";

export const configureDatabase = async ({ url = "", options = {} }) => {
  mongooseLong(mongoose);

  await mongoose
    .connect(url, options)
    .then(() => {
      console.log("Connect to MongoDB success " + url);
    })
    .catch((error) => {
      console.log("Connect to MongoDB failed", error);
      logger.logError(error);
    });

  mongoose.connection.once("open", function () {
    console.log("MongoDB database connection established successfully");
  });

  mongoose.connection.on("connected", () => {
    const message = `MongoDB connected at ${new Date()}`;
    logger.log(message);
  });

  mongoose.connection.on("reconnected", () => {
    const message = `MongoDB reconnected at ${new Date()}`;
    logger.logWarning(message);
  });

  mongoose.connection.on("disconnected", () => {
    logger.logWarning(`MongoDB disconnected at ${new Date()}`);
  });

  mongoose.connection.on("error", (err) => {
    logger.logError(err);
  });
};
