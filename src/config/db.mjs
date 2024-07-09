import mongoose from "mongoose";
import { logger, LogMessage } from "./winston.mjs";

function generateConntectionOptions() {
    return {
      user: process.env.MONGO_INITDB_ROOT_USERNAME,
      pass: process.env.MONGO_INITDB_ROOT_PASSWORD,
      dbName: process.env.DATABASE_ACTIVE_DB,
    };
}

export function createConnection() {
  var connectionString = process.env.DATABASE_CONNECTION_STRING;
  var connectionOptions = generateConntectionOptions();
  const rawConnection = mongoose.connect(connectionString, connectionOptions);
  const dbClientPromise = rawConnection
    .then((m) => m.connection.getClient())
    .then(
      () =>
        logger.info(
          "%o",
          new LogMessage("DB", "Connect", "DB authenticated and connected.")
        ),
      (err) =>
        logger.warn(
          "%o",
          new LogMessage("DB", "Connect", "DBAuthentication failed.\n ")
        )
    );
  return dbClientPromise;
}
