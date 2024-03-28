import winston from 'winston'

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
  