import { env } from "../config/index.js";
import { createLogger, format, transports } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";


const logger = createLogger({
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    verbose: 4,
    debug: 5,
    silly: 6,
  },
  level: env.LOG_LEVEL,
  format: format.combine(
    format.colorize({ all: true }),
    format.timestamp(),
    format.printf(
      ({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`,
    ),
  ),
  transports: [
    // new transports.Console(),
    new DailyRotateFile({
        dirname:'logs',
        filename:`application-%DATE%.log`,
datePattern:'YYYY-MM-DD',
zippedArchive:true,
maxFiles:'14d',
maxSize:'20m'
    })
  ],
});

export default logger;
