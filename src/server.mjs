// import newrelic from 'newrelic'
import { createSessionStore, validateAuth } from './middleware/session.mjs';
import express from 'express';
import createError from 'http-errors';
import cors from "cors";
import morgan from 'morgan';
import morganJson from 'morgan-json';
import { logger, networkLogger, LogMessage } from './config/winston.mjs';
import usersRouter from './routes/userRouter.mjs';
import authRouter from './routes/authRouter.mjs';
import enrollRouter from './routes/enrollmentRouter.mjs';
import listCoreRouter from './routes/list/listCore.mjs';
import listPurchaseRouter from './routes/list/listPurchases.mjs';
import listDetailRouter from './routes/list/listDetails.mjs';
import listInviteRouter from './routes/list/listInvite.mjs';
import listMemberRouter from './routes/list/listMembers.mjs';
import statsRouter from './routes/statsRouter.mjs';
import overviewRouter from './routes/overviewRouter.mjs';
import swaggerUi from 'swagger-ui-express'
// import openapiSpecification from './swagger.mjs'

import swaggerJSDoc from 'swagger-jsdoc';





export async function startServer() {
    const app = express()

    app.use(cors());
    const sessionStore = await createSessionStore();
    app.use(sessionStore)
    
    app.use(express.urlencoded({extended: true})); 
    app.use(express.json());   
    
    const format = morganJson(':date[iso] :method :url :status :remote-addr :response-time ms');
    
    app.enable("trust proxy")
    
    app.use(morgan(format, {
        stream: networkLogger.stream
    }));

    const options = {
        failOnErrors: true,
        definition: {
          openapi: '3.1.0',
          info: {
            title: 'Hello World',
            version: '1.0.0',
          },
        },
        apis: ['./**/*.mjs', './docs/parameters.yml'], // files containing annotations as above
      };
    const openapiSpecification = swaggerJSDoc(options);
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpecification));
    
    app.use('/' + process.env.BASE_API_BATH + '/users', validateAuth, usersRouter)
    app.use('/' + process.env.BASE_API_BATH + '/stats', validateAuth, statsRouter)
    app.use('/' + process.env.BASE_API_BATH + '/auth', authRouter)
    app.use('/' + process.env.BASE_API_BATH + '/enroll', enrollRouter)
    app.use('/' + process.env.BASE_API_BATH + '/lists', validateAuth, listCoreRouter)
    app.use('/' + process.env.BASE_API_BATH + '/lists/purchase', validateAuth, listPurchaseRouter)
    app.use('/' + process.env.BASE_API_BATH + '/lists/details', validateAuth, listDetailRouter)
    app.use('/' + process.env.BASE_API_BATH + '/lists/members/invite', validateAuth, listInviteRouter)
    app.use('/' + process.env.BASE_API_BATH + '/lists/members', validateAuth, listMemberRouter)
    app.use('/' + process.env.BASE_API_BATH + '/overview', validateAuth, overviewRouter)
    
    
    // simple route
    app.get("/", (_, res) => {
        res.json({
            message: "Welcome to the list application."
        });
    });
    
    
    // catch 404 and forward to error handler
    app.use(function (req, res, next) {
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
    const logInfo = new LogMessage("Server", "Startup", "Application is running.", {
        "port": process.env.API_PORT,
    });
    logger.info("%o", logInfo)

}
