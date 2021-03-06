const mongoose = require('mongoose')
const { logger, LogMessage } = require('./winston');

const connectionOptions = {
    user: process.env.MONGO_INITDB_ROOT_USERNAME,
    pass: process.env.MONGO_INITDB_ROOT_PASSWORD,
    // authSource: process.env.DATABASE_AUTH_SOURCE,
    dbName: process.env.DATABASE_ACTIVE_DB,
    useNewUrlParser: process.env.DATABASE_OPTIONS_USE_NEW_URL_PARSER,
    useUnifiedTopology: process.env.DATABASE_OPTIONS_USE_UNIFIED_TOPOLOGY,
    useFindAndModify: false,
    useCreateIndex: true
}


mongoose.connect(process.env.DATABASE_URL, connectionOptions)
const db = mongoose.connection
db.on('error', (error) => logger.warn("%o", new LogMessage("DB", "Connect", "DBAuthentication failed.\n ")))
db.once('open', () => logger.info("%o", new LogMessage("DB", "Connect", "DB authenticated and connected.")))
