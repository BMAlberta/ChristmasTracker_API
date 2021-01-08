var appRoot = require('app-root-path');
var winston = require('winston');
const { combine, timestamp, printf, prettyPrint, splat, simple } = winston.format;


// define the custom settings for each transport (file, console)
var options = {
  file: {
    level: 'info',
    filename: `${appRoot}/logs/app.log`,
    handleExceptions: true,
    json: true,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    colorize: true,
  },
  console: {
    level: 'debug',
    handleExceptions: true,
    json: true,
    colorize: true,
  },
};

const myFormat = printf(info => {
    // you can get splat attribue here as info[Symbol.for("splat")]
    // if you custome splat please rem splat() into createLogger()
    return `{ timestamp: ${info.timestamp}, level: [${info.level.toUpperCase()}], data: ${info.message}}`;
});

// instantiate a new Winston Logger with the settings defined above
var logger = winston.createLogger({
    format: combine(
        timestamp(),
        splat(),
        myFormat
      ),
  transports: [
    new winston.transports.File(options.file),
    new winston.transports.Console(options.console)
  ],
  exitOnError: false, // do not exit on handled exceptions
});

var networkLogger = winston.createLogger({
  transports: [
    new winston.transports.File(options.file),
    new winston.transports.Console(options.console)
  ],
  exitOnError: false, // do not exit on handled exceptions
});

// create a stream object with a 'write' function that will be used by `morgan`
networkLogger.stream = {
  write: function(message, encoding) {
    // use the 'info' log level so the output will be picked up by both transports (file and console)
    networkLogger.info(message);
  },
};

function LogMessage(process, event, message, details) {
  this.process = process
  this.event = event
  this.message = message
  if (details != null) {
    this.details = details
  } else {
    this.details = {}
  }
}

module.exports = { logger, networkLogger, LogMessage }