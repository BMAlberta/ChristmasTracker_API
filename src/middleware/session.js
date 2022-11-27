var sessionManager = require('express-session')
var MongoDBStore = require('connect-mongodb-session')(sessionManager);
const {
	logger,
	LogMessage
} = require('../config/winston');


const connectionString = process.env.DATABASE_URI_SCHEME + process.env.MONGO_INITDB_ROOT_USERNAME + ":" + process.env.MONGO_INITDB_ROOT_PASSWORD + "@" + process.env.DATABASE_URI_HOST

var store = new MongoDBStore({
	// uri: connectionString,
	uri: process.env.DATABASE_URL,
	databaseName: process.env.DATABASE_ACTIVE_DB,
	collection: 'sessions'
});

var sessionStore = sessionManager({
	secret: process.env.SESSION_SECRET,
	cookie: {
		maxAge: 1800000
	},
	store: store,
	resave: true,
	saveUninitialized: false
});

function generateConnectionString() {
	if (process.env.NODE_ENV === 'development') {
		return process.env.DATABASE_URL
	} else {
		return process.env.DATABASE_URI_SCHEME + process.env.MONGO_INITDB_ROOT_USERNAME + ":" + process.env.MONGO_INITDB_ROOT_PASSWORD + "@" + process.env.DATABASE_URI_HOST
	}
}

function validateAuth(request, response, next) {
	if (!request.session?.details?.userAuthenticated) {
		logger.info("%o", new LogMessage("SessionManager", "validateAuth", "Session authentication not valid."))
		return response.status(401).json({
			error: "Missing authentication"
		});
	} else {
		logger.info("%o", new LogMessage("SessionManager", "validateAuth", "Session validated.", {
			"sessionInfo": request.session.details
		}))
		next();
	}
};

function enrollmentActive(request, response, next) {
	if (!request.session.user) {
		logger.info("%o", new LogMessage("SessionManager", "enrollmentActive", "Session authentication not valid."))
		return response.status(401).json({
			error: "Missing authentication"
		});
	} else {
		logger.info("%o", new LogMessage("SessionManager", "enrollmentActive", "Session validated.", {
			"sessionInfo": request.session.user
		}))
		next();
	}
};

function getUser(req, res, next) {
	const user = req.session.details.userId
	if (user != null) {
		res.userId = user.toString()
		logger.info("%o", new LogMessage("Validate Token", "getUser", "Found user.", {
			"userInfo": user
		}))
		next()
	} else {
		logger.info("%o", new LogMessage("Validate Token", "getUser", "Unable to locate user.", {
			"userInfo": user
		}))
		return res.status(500).json({
			message: "Unable to find a user"
		})
	}
};

module.exports = {
	sessionStore,
	validateAuth,
	enrollmentActive,
	getUser
}
