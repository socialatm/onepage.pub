import ActivityObject from './activity-object.mjs'
import { promisify } from 'util'
import crypto from 'crypto'

const HOSTNAME = process.env.OPP_HOSTNAME
const PORT = process.env.OPP_PORT
const ORIGIN = process.env.OPP_ORIGIN || ((PORT === 443) ? `https://${HOSTNAME}` : `https://${HOSTNAME}:${PORT}`)
const generateKeyPair = promisify(crypto.generateKeyPair)

function makeUrl (relative) {
    if (relative.length > 0 && relative[0] === '/') {
      relative = relative.slice(1)
    }
    return `${ORIGIN}/${relative}`
  }

  function toArray (value) {
    if (typeof value === 'undefined') {
      return []
    } else if (value === null) {
      return []
    } else if (Array.isArray(value)) {
      return value
    } else {
      return [value]
    }
  }

  async function toId (value) {
    if (typeof value === 'undefined') {
      return null
    } else if (value === null) {
      return null
    } else if (value instanceof ActivityObject) {
      return await value.id()
    } else if (typeof value === 'string') {
      return value
    } else if (typeof value === 'object' && 'id' in value) {
      return value.id
    } else {
      throw new Error(`Can't convert ${JSON.stringify(value)} to id`)
    }
  }

  const newKeyPair = async () => {
    return await generateKeyPair(
      'rsa',
      {
        modulusLength: 2048,
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem'
        },
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem'
        }
      }
    )
  }

  export {
    makeUrl,
    toArray,
    toId,
    newKeyPair
  }
  