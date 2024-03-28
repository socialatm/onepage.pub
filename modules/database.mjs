import sqlite3 from 'sqlite3'
import logger from './logger.mjs'

class Database {
    #path = null
    #db = null
    constructor (path) {
      this.#path = path
      this.#db = new sqlite3.Database(this.#path)
    }
  
    async init () {
      await this.run('CREATE TABLE IF NOT EXISTS user (username VARCHAR(255) PRIMARY KEY, passwordHash VARCHAR(255), actorId VARCHAR(255), privateKey TEXT)')
      await this.run('CREATE TABLE IF NOT EXISTS object (id VARCHAR(255) PRIMARY KEY, owner VARCHAR(255), data TEXT)')
      await this.run('CREATE TABLE IF NOT EXISTS addressee (objectId VARCHAR(255), addresseeId VARCHAR(255))')
      await this.run('CREATE TABLE IF NOT EXISTS upload (relative VARCHAR(255), mediaType VARCHAR(255), objectId VARCHAR(255))')
      await this.run('CREATE TABLE IF NOT EXISTS server (origin VARCHAR(255) PRIMARY KEY, privateKey TEXT, publicKey TEXT)')
  
      // Create the public key for this server if it doesn't exist
  
      await Server.ensureKey()
    }
  
    async run (...params) {
      logger.silly('run() SQL: ' + params[0], params.slice(1))
      return new Promise((resolve, reject) => {
        this.#db.run(...params, (err, results) => {
          if (err) {
            reject(err)
          } else {
            resolve(results)
          }
        })
      })
    }
  
    async get (...params) {
      logger.silly('get() SQL: ' + params[0], params.slice(1))
      return new Promise((resolve, reject) => {
        this.#db.get(...params, (err, results) => {
          if (err) {
            reject(err)
          } else {
            resolve(results)
          }
        })
      })
    }
  
    async all (...params) {
      logger.silly('all() SQL: ' + params[0], params.slice(1))
      return new Promise((resolve, reject) => {
        this.#db.all(...params, (err, results) => {
          if (err) {
            reject(err)
          } else {
            resolve(results)
          }
        })
      })
    }
  
    async close () {
      return new Promise((resolve, reject) => {
        this.#db.close((err) => {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        })
      })
    }
  
    async ready () {
      try {
        const value = await this.get('SELECT 1')
        return !!value
      } catch (err) {
        return false
      }
    }
  }

  export default Database