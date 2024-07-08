require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` });
require("./config/db")

const express = require('express')
const createError = require('http-errors');
const app = express()
const cors = require("cors")
const morgan = require('morgan')
const morganJson = require('morgan-json');
const {
    logger, networkLogger, LogMessage
} = require('./config/winston');
const sessionUtils = require('./middleware/session')
const usersRouter = require('./routes/userRouter')

const authRouter = require('./routes/authRouter')
const enrollRouter = require('./routes/enrollmentRouter')
const listCoreRouter = require('./routes/list/listCore')
const listPurchaseRouter = require('./routes/list/listPurchases')
const listDetailRouter = require('./routes/list/listDetails')
const listInviteRouter = require('./routes/list/listInvite')
const listMemberRouter = require('./routes/list/listMembers')
const statsRouter = require('./routes/statsRouter')

app.use(cors());

// parse requests of content-type - application/json
app.use(express.json());

app.use(sessionUtils.sessionStore)

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded());

const format = morganJson(':date[iso] :method :url :status :remote-addr :response-time ms');

app.enable("trust proxy")


app.use(morgan(format, {
    stream: networkLogger.stream
}));

app.use('/' + process.env.BASE_API_BATH + '/users', sessionUtils.validateAuth, usersRouter)
app.use('/' + process.env.BASE_API_BATH + '/stats', sessionUtils.validateAuth, statsRouter)
app.use('/' + process.env.BASE_API_BATH + '/auth', authRouter)
app.use('/' + process.env.BASE_API_BATH + '/enroll', enrollRouter)
app.use('/' + process.env.BASE_API_BATH + '/lists', sessionUtils.validateAuth, listCoreRouter)
app.use('/' + process.env.BASE_API_BATH + '/lists/purchase', sessionUtils.validateAuth, listPurchaseRouter)
app.use('/' + process.env.BASE_API_BATH + '/lists/details', sessionUtils.validateAuth, listDetailRouter)
app.use('/' + process.env.BASE_API_BATH + '/lists/members/invite', sessionUtils.validateAuth, listInviteRouter)
app.use('/' + process.env.BASE_API_BATH + '/lists/members', sessionUtils.validateAuth, listMemberRouter)


// simple route
app.get("/", (_, res) => {
    res.json({
        message: "Welcome to the list application."
    });
});


// catch 404 and forward to error handler
app.use(function (_, _, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, _) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = process.env.NODE_ENV === 'development' ? err : {};

    // add this line to include winston logging
    logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

    // render the error page
    res.status(err.status || 500);
    res.json({
        message: err.message
    })
});

app.listen(3000)
var logInfo = new LogMessage("Server", "Startup", "Application is running.", {
    "port": process.env.API_PORT,
})
logger.info("%o", logInfo)
