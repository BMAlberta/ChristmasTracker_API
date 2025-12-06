import sessionManager from 'express-session';
import { logger, LogMessage } from '../config/winston.mjs';
import MemcachedStoreFactory from 'connect-memjs';

export async function createSessionStore() {

	// try {
	// 	const dbConnection = await getDbConnection();
	// } catch (err) {
	// 	throw Error("Unable to get a connection")
	// }
	const MemcachedStore = MemcachedStoreFactory(sessionManager);
    let memcacheConnection = process.env.MEMCACHE_SERVER + ":" + process.env.MEMCACHE_PORT
	let store = new MemcachedStore({
		servers: [memcacheConnection], // Array of Memcached server addresses
		prefix: '_session_' // Optional prefix for session keys in Memcached
	});

	let sessionStore = sessionManager({
		secret: process.env.SESSION_SECRET,
		cookie: {
			maxAge: 3600000,
		},
        rolling: true,
		store: store,
		resave: true,
		saveUninitialized: false
	});

	return sessionStore
}


export function validateAuth(request, response, next) {
	if (!request.session?.details?.userAuthenticated) {
		logger.warn("%o", new LogMessage("SessionManager", "validateAuth", "Session authentication not valid."), request)
		return response.status(401).json({
			error: "Missing authentication"
		});
	} else {
		logger.info("%o", new LogMessage("SessionManager", "validateAuth", "Session validated.", {
			"sessionInfo": request.session.details
		}, request))
		next();
	}
}

export function enrollmentActive(request, response, next) {
	if (!request.session.user) {
		logger.warn("%o", new LogMessage("SessionManager", "enrollmentActive", "Session authentication not valid."))
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
		}, req))
		next()
	} else {
		logger.warn("%o", new LogMessage("Validate Token", "getUser", "Unable to locate user.", {
			"userInfo": user
		}, req))
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
