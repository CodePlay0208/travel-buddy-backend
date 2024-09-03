const winston = require('winston');
const { createLogger, format, transports } = winston;
const { combine, timestamp, printf, colorize } = format;

// Define a custom color scheme for log levels
const customColors = {
  error: 'red bold',
  warn: 'yellow bold',
  info: 'green bold',
  http: 'magenta bold',
  verbose: 'cyan bold',
  debug: 'blue bold',
  silly: 'rainbow bold',
};

// Apply the custom colors to winston
winston.addColors(customColors);

// Define the custom format for log messages
const myFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`;
});

// Create the logger
const logger = createLogger({
  level: 'info',  // Set the default log level
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),  // Add a timestamp to logs
    myFormat  // Apply the custom format
  ),
  transports: [
    // Log messages to the console with colors
    new transports.Console({
      format: combine(
        colorize({ all: true }),  // Apply custom color scheme to console logs
      )
    }),
    
    // Log messages to a file
    new transports.File({ filename: 'combined.log' })
  ],
});

// Export the logger so it can be used in other files
module.exports = logger;
