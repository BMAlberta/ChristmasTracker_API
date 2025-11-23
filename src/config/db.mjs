import {logger, LogMessage} from "./winston.mjs";
import mariadb from "mariadb";
import dotenv from 'dotenv'
import { expand } from 'dotenv-expand';
const result = expand(dotenv.config({ path: `../config/.env.${process.env.NODE_ENV}` }))
if (result.error) {
    throw result.error;
}

function generateConnectionOptions() {

    const connOptions =
        {
            host: process.env.MARIADB_HOST,
            user: process.env.MARIADB_USER,
            password: process.env.MARIADB_PASS,
            connectionLimit: process.env.MARIADB_CONNECTION_LIMIT
        };

    const options = {
        host: process.env.MARIADB_HOST,
        port: process.env.MARIADB_PORT, // Default MariaDB port
        user: process.env.MARIADB_USER,
        password: process.env.MARIADB_PASS,
        database: process.env.MARIADB_DATABASE,
        connectionLimit: process.env.MARIADB_CONNECTION_LIMIT
        // Optional:
        // ssl: true, // Enable SSL/TLS encryption
        // metaAsArray: false, // Return metadata as objects instead of arrays
        // dateStrings: true, // Return date/datetime values as strings
    }

    return options
}

const connectionPool = mariadb.createPool(generateConnectionOptions());


export async function getDbConnection() {
    try {
        let connection = await connectionPool.getConnection();
        // logger.info(
        //     "%o",
            // new LogMessage("DB", "Connect", "Connection returned.", {
            //     "totalConnections": connectionPool.totalConnections(),
            //     "activeConnections": connectionPool.activeConnections(),
            //     "idleConnections:": connectionPool.idleConnections()
            // }))
        return connection
    } catch (err) {
        throw Error(err)
    }
}