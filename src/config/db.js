const mongoose = require('mongoose')
const {
	logger,
	LogMessage
} = require('./winston');

const connectionOptions = {
	user: process.env.MONGO_INITDB_ROOT_USERNAME,
	pass: process.env.MONGO_INITDB_ROOT_PASSWORD,
	// authSource: process.env.DATABASE_AUTH_SOURCE,
	dbName: process.env.DATABASE_ACTIVE_DB
}

mongoose.connect(process.env.DATABASE_URL, connectionOptions)
const db = mongoose.connection
db.on('error', (_) => logger.warn("%o", new LogMessage("DB", "Connect", "DBAuthentication failed.\n ")))
db.once('open', () => logger.info("%o", new LogMessage("DB", "Connect", "DB authenticated and connected.")))
