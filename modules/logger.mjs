import winston from 'winston'

const LOG_LEVEL = process.env.OPP_LOG_LEVEL

const logger = winston.createLogger({
    level: LOG_LEVEL,
    format: winston.format.printf((info) => {
      return `${(new Date()).toISOString()} ${info.level}: ${info.message}`
    }),
    transports: [
      new winston.transports.Console()
    ]
  })

  export default logger
  