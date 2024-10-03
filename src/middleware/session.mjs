import sessionManager from 'express-session';
import MongoStore from 'connect-mongo'
import { getDbConnection } from '../config/db.mjs';
import { logger, LogMessage } from '../config/winston.mjs';

export async function createSessionStore() {

	try {
		var dbConnection = await getDbConnection()
	} catch (err) {
		throw Error("Unable to get a connection")
	}
	
	var client = dbConnection.getClient()
	var store = MongoStore.create(
		{client: client});
	
	var sessionStore = sessionManager({
		secret: process.env.SESSION_SECRET,
		cookie: {
			maxAge: 1800000
		},
		store: store,
		resave: true,
		saveUninitialized: false
	});

	return sessionStore
}


export function validateAuth(request, response, next) {
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
}

export function enrollmentActive(request, response, next) {
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
}

export function getUser(req, res, next) {
	res.userId = ""
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
	// next()
}

export default {
	createSessionStore,
	validateAuth,
	enrollmentActive,
	getUser
};
