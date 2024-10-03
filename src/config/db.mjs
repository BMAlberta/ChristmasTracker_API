import mongoose from "mongoose";
import { logger, LogMessage } from "./winston.mjs";

function generateConntectionOptions() {
  
  const connOptions = 
  {
    user: process.env.MONGO_INITDB_ROOT_USERNAME,
    pass: process.env.MONGO_INITDB_ROOT_PASSWORD,
    dbName: process.env.DATABASE_ACTIVE_DB,
  };
    return connOptions
}


export async function getDbConnection() {
  var connectionString = process.env.DATABASE_CONNECTION_STRING;
  var connectionOptions = generateConntectionOptions();
  
  try {
    await mongoose.connect(connectionString, connectionOptions);
    const db = mongoose.connection
    logger.info(
      "%o",
      new LogMessage("DB", "Connect", "DB authenticated and connected."))
      return db
  } catch (err) {
    logger.warn(
      "%o",
      new LogMessage("DB", "Connect", {"error": err})
    )
    throw Error("DB Connection Failed.")
  }
}