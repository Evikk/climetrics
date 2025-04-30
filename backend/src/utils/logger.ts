import winston from "winston";

// Define log levels and colors
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

winston.addColors(colors);

// Choose the log level based on the environment
const level = () => {
  const env = process.env.NODE_ENV || "development";
  const isDevelopment = env === "development";
  return isDevelopment ? "debug" : "warn";
};

// Define the format for console logs
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Define transports (where logs go)
const transports = [
  new winston.transports.Console({ format: consoleFormat }),
  // TODO: Add file transport for production environments
  // new winston.transports.File({
  //   filename: 'logs/error.log',
  //   level: 'error',
  // }),
  // new winston.transports.File({ filename: 'logs/all.log' }),
];

// Create the logger instance
const Logger = winston.createLogger({
  level: level(),
  levels,
  format: winston.format.json(), // Default format for non-console transports
  transports,
  exceptionHandlers: [
    // Also log uncaught exceptions
    new winston.transports.Console({ format: consoleFormat }),
    // TODO: Add file transport for exceptions in production
    // new winston.transports.File({ filename: 'logs/exceptions.log' }),
  ],
  rejectionHandlers: [
    // Also log unhandled promise rejections
    new winston.transports.Console({ format: consoleFormat }),
    // TODO: Add file transport for rejections in production
    // new winston.transports.File({ filename: 'logs/rejections.log' }),
  ],
  exitOnError: false, // Do not exit on handled exceptions
});

export default Logger;
