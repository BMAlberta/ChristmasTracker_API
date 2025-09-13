import mongoose from "mongoose";
import { logger, LogMessage } from "./winston.mjs";
import mariadb from "mariadb";

function generateConntectionOptions_legacy() {
  
  const connOptions =
  {
    user: process.env.MONGO_INITDB_ROOT_USERNAME,
    pass: process.env.MONGO_INITDB_ROOT_PASSWORD,
    dbName: process.env.DATABASE_ACTIVE_DB,
  };
    return connOptions
}

function generateConntectionOptions() {

  const connOptions =
      {
        host: process.env.MARIADB_HOST,
        user: process.env.MARIADB_USER,
        password: process.env.MARIADB_PASS,
        connectionLimit: process.env.MARIADB_CONNECTION_LIMIT
      };

  const options = {
    host: 'poseidon.ad.bmalberta.com',
    port: 3307, // Default MariaDB port
    user: 'root',
    password: 'password',
    database: 'tracker',
    // Optional:
    // ssl: true, // Enable SSL/TLS encryption
    // metaAsArray: false, // Return metadata as objects instead of arrays
    // dateStrings: true, // Return date/datetime values as strings
  }

  return options
}


export async function getDbConnection_legacy() {
  var connectionString = process.env.DATABASE_CONNECTION_STRING;
  var connectionOptions = generateConntectionOptions_legacy();
  
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


export async function getDbConnection() {
  try {
    const pool = await mariadb.createPool(generateConntectionOptions());
    let connection = await pool.getConnection();
    logger.info(
        "%o",
        new LogMessage("DB", "Connect", "Connection returned.", {"connection": connection}))
    return connection
  } catch (err) {
    throw Error("Unable to get connection from pool.")
  }
}