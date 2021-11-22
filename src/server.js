require('dotenv').config()
require("./config/db")

const express = require('express')
var createError = require('http-errors');
const app = express()
const cors = require("cors")
const jwtValidation = require("./middleware/validate-token")
const morgan = require('morgan')
const morganJson = require('morgan-json');
const { logger, networkLogger, LogMessage } = require('./config/winston');

const usersRouter = require('./routes/users')
const itemsRouter = require('./routes/items')
const purchasedRouter = require('./routes/purchases')
const authRouter = require('./routes/auth')
const statRouter = require('./routes/stats')


app.use(cors());

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded());

const format = morganJson(':date[iso] :method :url :status :remote-addr :response-time ms');

app.use(morgan(format, { stream: networkLogger.stream }));


app.use('/' + process.env.BASE_API_BATH + '/users', jwtValidation.verifyToken, usersRouter)
app.use('/' + process.env.BASE_API_BATH + '/items', jwtValidation.verifyToken, itemsRouter)
app.use('/' + process.env.BASE_API_BATH + '/purchases', jwtValidation.verifyToken, purchasedRouter)
app.use('/' + process.env.BASE_API_BATH + '/stats', jwtValidation.verifyToken, statRouter)
app.use('/' + process.env.BASE_API_BATH + '/auth', authRouter)


// simple route
app.get("/", (_, res) => {
  res.json({ message: "Welcome to list application." });
});


// catch 404 and forward to error handler
app.use(function (_, _, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, _) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  console.log(process.env.NODE_ENV)
  res.locals.error = process.env.NODE_ENV === 'development' ? err : {};

  // add this line to include winston logging
  logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

  // render the error page
  res.status(err.status || 500);
  res.json({ message: err.message })
});

app.listen(3000)
var logInfo = new LogMessage("Server", "Startup", "Application is running.", { "port": process.env.API_PORT })
logger.info("%o", logInfo)
