import appRoot from 'app-root-path';
import winston, { format } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { namespace } from '../middleware/trace.mjs';
const { combine, timestamp, printf, splat } = winston.format;




const hookedFormat = format((info) => {
    const traceId = namespace.get('traceId');

    if (typeof traceId !== 'undefined') {
        info.traceId = traceId;
    } else {
        info.traceId = "NO_TRACE_ID";
    }

    return info;
});


// define the custom settings for each transport (file, console)
const options = {
  file: {
    level: 'debug',
    filename: `${appRoot}/logs/app.log`,
    handleExceptions: true,
    json: false,
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
    // you can get splat attribute here as info[Symbol.for("splat")]
    // if you custom splat please rem splat() into createLogger()

    return `{ "timestamp": "${info.timestamp}", "traceId": "${info.traceId}", "level": "${info.level.toUpperCase()}", "data": ${JSON.stringify(formatMeta(info))}}`;
});

const formatMeta = (meta) => {
  // You can format the splat yourself
  const splat = meta[Symbol.for('splat')];
  if (splat && splat.length) {
    // let extracted = splat.length === 1 ? JSON.stringify(splat[0]) : JSON.stringify(splat);
    let extracted = splat.length === 1 ? splat[0] : splat;
    return extracted
  }
  return '';
};

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
        hookedFormat(),
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

export function LogMessage(process, event, message, details, req) {
    this.process = process
    this.event = event
    this.message = message
    this.details = details ?? ""
    this.req = req

    return generateLogMessage(this)
}

function generateLogMessage(rawLog) {
  let metadata;
  if (rawLog.req != null) {
    metadata = generateLogMetadataData(rawLog.req)
  }

  const data = {
    process: rawLog.process,
    event: rawLog.event,
    message: rawLog.message,
    details: rawLog.details
  };

  let log = {
    metadata: metadata,
    data: data
  }
  return log
}


function generateLogMetadataData(req) {

  let agent = {
    av: req.headers.av ?? "NAP",
    os: req.headers.os ?? "NOP" 
  }

  const log = {
    channel: req.headers.channel ?? "NCP",
    agent: agent,
    sessionId: req.session?.id ?? "NSP"
  };
  return log
}

