const winston = require("winston");
const { createLogger, format, transports } = winston;
const { combine, timestamp, printf, colorize } = format;

const customColors = {
  error: "red bold",
  warn: "yellow bold",
  info: "green bold",
  http: "magenta bold",
  verbose: "cyan bold",
  debug: "blue bold",
  silly: "rainbow bold",
};

winston.addColors(customColors);

const myFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`;
});

const logger = createLogger({
  level: "info",
  format: combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), myFormat),
  transports: [
    new transports.Console({
      format: combine(colorize({ all: true })),
    }),
  ],
});

module.exports = logger;
