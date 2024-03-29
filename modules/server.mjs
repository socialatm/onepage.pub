import { makeUrl } from './utilities.mjs'
import {db} from '../index.mjs'

class Server {
    #origin
    #publicKey
    #privateKey
    static #singleton
    constructor (origin, publicKey, privateKey) {
      this.#origin = origin
      this.#publicKey = publicKey
      this.#privateKey = privateKey
    }
  
    static async get () {
      if (!Server.#singleton) {
        const origin = makeUrl('')
        const row = await db.get('SELECT * FROM server where origin = ?', [origin])
        if (!row) {
          Server.#singleton = null
        } else {
          Server.#singleton = new Server(row.origin, row.publicKey, row.privateKey)
        }
      }
      return Server.#singleton
    }
  
    keyId () {
      return makeUrl('key')
    }
  
    toJSON () {
      return {
        '@context': CONTEXT,
        id: this.#origin,
        type: 'Service',
        name: process.OPP_NAME || 'One Page Pub',
        publicKey: {
          type: 'Key',
          id: this.keyId(),
          owner: this.#origin,
          publicKeyPem: this.#publicKey
        }
      }
    }
  
    getKeyJSON () {
      return {
        '@context': CONTEXT,
        type: 'Key',
        id: this.keyId(),
        owner: this.#origin,
        publicKeyPem: this.#publicKey
      }
    }
  
    privateKey () {
      return this.#privateKey
    }
  
    publicKey () {
      return this.#publicKey
    }
  
    static async ensureKey () {
      const row = await db.get('SELECT * FROM server WHERE origin = ?', [makeUrl('')])
      if (!row) {
        const { publicKey, privateKey } = await newKeyPair()
        await db.run(
          'INSERT INTO server (origin, privateKey, publicKey) ' +
          ' VALUES (?, ?, ?) ' +
          ' ON CONFLICT DO NOTHING',
          [makeUrl(''), privateKey, publicKey]
        )
      } else if (!row.privateKey) {
        const { publicKey, privateKey } = await newKeyPair()
        await db.run(
          'UPDATE server ' +
          ' SET privateKey = ?, publicKey = ? ' +
          ' WHERE origin = ?',
          [privateKey, publicKey, makeUrl('')]
        )
      } else if (row.privateKey.match(/^-----BEGIN RSA PRIVATE KEY-----/)) {
        const privateKey = toPkcs8(row.privateKey)
        const publicKey = toSpki(row.publicKey)
        await db.run(
          'UPDATE server ' +
          ' SET privateKey = ?, publicKey = ? ' +
          ' WHERE origin = ?',
          [privateKey, publicKey, makeUrl('')]
        )
      }
    }
  }

  export default Server
