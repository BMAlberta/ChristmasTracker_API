import appRoot from 'app-root-path';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
const { combine, timestamp, printf, splat } = winston.format;


// define the custom settings for each transport (file, console)
var options = {
  file: {
    level: 'debug',
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

const dailyLogRoller = new (winston.transports.DailyRotateFile)({
  filename: `${appRoot}/logs/christmasTrackerAPI-%DATE%.log`,
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  colorize: true,
  json: true
});

// instantiate a new Winston Logger with the settings defined above
export var logger = winston.createLogger({
    format: combine(
        timestamp(),
        splat(),
        myFormat
      ),
  transports: [
    // new winston.transports.File(options.file),
    new winston.transports.Console(options.console),
    dailyLogRoller
  ],
  exitOnError: false, // do not exit on handled exceptions
});

export var networkLogger = winston.createLogger({
  transports: [
    new winston.transports.File(options.file),
    new winston.transports.Console(options.console)
  ],
  exitOnError: false, // do not exit on handled exceptions
});

// create a stream object with a 'write' function that will be used by `morgan`
networkLogger.stream = {
  write: function(message) {
    // use the 'info' log level so the output will be picked up by both transports (file and console)
    networkLogger.info(message);
  },
};

export function LogMessage(process, event, message, details) {
  this.process = process
  this.event = event
  this.message = message
  if (details != null) {
    this.details = details
  } else {
    this.details = {}
  }
}

