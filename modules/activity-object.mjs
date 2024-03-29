import { nanoid } from 'nanoid'
import {db, toArray, toId, makeUrl } from '../index.mjs'

const PUBLIC = 'https://www.w3.org/ns/activitystreams#Public'
const isString = value => typeof value === 'string' || value instanceof String

class ActivityObject {
  #id
  #json
  #owner
  #addressees
  #complete = false
  constructor (data) {
    if (!data) {
      throw new Error('No data provided')
    } else if (isString(data)) {
      this.#id = data
    } else {
      this.#json = data
      this.#id = this.#json.id || this.#json['@id'] || null
    }
  }

  static async makeId (type) {
    const best = ActivityObject.bestType(type)
    if (best) {
      return makeUrl(`${best.toLowerCase()}/${nanoid()}`)
    } else {
      return makeUrl(`object/${nanoid()}`)
    }
  }

  static async getJSON (id) {
    if (id === PUBLIC) {
      return PUBLIC_OBJ
    }
    const row = await db.get('SELECT data FROM object WHERE id = ?', [id])
    if (!row) {
      return null
    } else {
      return JSON.parse(row.data)
    }
  }

  static async get (ref, props = null, subject = null) {
    if (props && !Array.isArray(props)) {
      throw new Error(`Invalid props: ${JSON.stringify(props)}`)
    }
    if (typeof ref === 'string') {
      return await ActivityObject.getById(ref, subject)
    } else if (typeof ref === 'object') {
      if (ref instanceof ActivityObject) {
        return ref
      } else if (props && props.every((prop) =>
        Array.isArray(prop) ? prop.some(p => p in ref) : prop in ref)) {
        return new ActivityObject(ref)
      } else if ('id' in ref) {
        return await ActivityObject.getById(ref.id, subject)
      } else {
        throw new Error(`Can't get object from ${JSON.stringify(ref)}`)
      }
    }
  }

  static async getById (id, subject = null) {
    if (id === PUBLIC) {
      return new ActivityObject(PUBLIC_OBJ)
    }
    const obj = await ActivityObject.getFromDatabase(id, subject)
    if (obj) {
      return obj
    } else if (ActivityObject.isRemoteId(id)) {
      return await ActivityObject.getFromRemote(id, subject)
    } else {
      return null
    }
  }

  static async getFromDatabase (id, subject = null) {
    const row = await db.get('SELECT data FROM object WHERE id = ?', [id])
    if (!row) {
      return null
    } else {
      const obj = new ActivityObject(JSON.parse(row.data))
      obj.#complete = true
      return obj
    }
  }

  /**
   * Fetches an ActivityObject from a remote server. 
   * 
   * @param {string} id - The ID of the ActivityObject to fetch
   * @param {Object} [subject=null] - The subject making the request, used for signing
   * @returns {Promise<ActivityObject>} The fetched ActivityObject, or null if not found
   */
  static async getFromRemote (id, subject = null) {
    const date = new Date().toISOString()
    const headers = {
      Date: date,
      Accept: ACCEPT_HEADER
    }
    let keyId = null
    let privKey = null
    if (subject && await User.isUser(subject)) {
      const user = await User.fromActorId(await toId(subject))
      const subjectObj = await ActivityObject.get(subject, ['publicKey'], subject)
      keyId = await toId(await subjectObj.prop('publicKey'))
      privKey = user.privateKey
    } else {
      const server = await Server.get()
      keyId = server.keyId()
      privKey = server.privateKey()
    }
    const signature = new HTTPSignature(keyId, privKey, 'GET', id, date)
    headers.Signature = signature.header
    if(!isSSRFSafeURL(id) && process.env.NODE_ENV === 'production') {
      logger.warn(`unsafe URL: ${id}`)
      return null
    }
      const res = await fetch(id, { headers })
    if (res.status !== 200) {
      logger.warn(`Error fetching ${id}: ${res.status} ${res.statusText}`)
      return null
    } else {
      const json = await res.json()
      const obj = new ActivityObject(json)
      const owner = ActivityObject.guessOwner(json)
      const addressees = ActivityObject.guessAddressees(json)
      obj.#complete = true
      await obj.cache(owner, addressees)
      return obj
    }
  }

  static guessOwner (json) {
    for (const prop of ['attributedTo', 'actor', 'owner']) {
      if (prop in json) {
        return json[prop]
      }
    }
    return null
  }

  static guessAddressees (json) {
    let addressees = []
    for (const prop of ['to', 'cc', 'bto', 'bcc', 'audience']) {
      if (prop in json) {
        addressees = addressees.concat(toArray(json[prop]))
      }
    }
    return addressees
  }

  static async exists (id) {
    const row = await db.get('SELECT id FROM object WHERE id = ?', [id])
    return !!row
  }

  async json () {
    if (!this.#json) {
      this.#json = await ActivityObject.getJSON(this.#id)
    }
    return this.#json
  }

  async _setJson (json) {
    this.#json = json
  }

  async _hasJson () {
    return !!this.#json
  }

  async id () {
    if (!this.#id) {
      this.#id = await this.prop('id')
    }
    return this.#id
  }

  async type () {
    return this.prop('type')
  }

  async name (lang = null) {
    const [name, nameMap, summary, summaryMap] = await Promise.all([
      this.prop('name'),
      this.prop('nameMap'),
      this.prop('summary'),
      this.prop('summaryMap')
    ])
    if (nameMap && lang in nameMap) {
      return nameMap[lang]
    } else if (name) {
      return name
    } else if (summaryMap && lang in summaryMap) {
      return summaryMap[lang]
    } else if (summary) {
      return summary
    }
  }

  async prop (name) {
    const json = await this.json()
    if (json) {
      return json[name]
    } else {
      return null
    }
  }

  async setProp (name, value) {
    const json = await this.json()
    if (json) {
      json[name] = value
      this.#json = json
    } else {
      this.#json = { [name]: value }
    }
  }

  async expand () {
    const json = await this.expanded()
    this.#json = json
    return this.#json
  }

  async isCollection () {
    return ['Collection', 'OrderedCollection'].includes(await this.type())
  }

  async isCollectionPage () {
    return ['CollectionPage', 'OrderedCollectionPage'].includes(await this.type())
  }

  async save (owner = null, addressees = null) {
    const data = await this.compressed()
    if (!owner) {
      owner = ActivityObject.guessOwner(data)
    }
    if (!addressees) {
      addressees = ActivityObject.guessAddressees(data)
    }
    data.type = data.type || this.defaultType()
    data.id = data.id || await ActivityObject.makeId(data.type)
    data.updated = new Date().toISOString()
    data.published = data.published || data.updated
    // self-ownership
    const ownerId = (await toId(owner)) || data.id
    const addresseeIds = await Promise.all(addressees.map((addressee) => toId(addressee)))
    await db.run('INSERT INTO object (id, owner, data) VALUES (?, ?, ?)', [data.id, ownerId, JSON.stringify(data)])
    await Promise.all(addresseeIds.map((addresseeId) =>
      db.run(
        'INSERT INTO addressee (objectId, addresseeId) VALUES (?, ?)',
        [data.id, addresseeId]
      )))
    this.#id = data.id
    this.#json = data
  }

  static #coreTypes = ['Object', 'Link', 'Activity', 'IntransitiveActivity', 'Collection',
    'OrderedCollection', 'CollectionPage', 'OrderedCollectionPage']

  static #activityTypes = ['Accept', 'Add', 'Announce', 'Arrive', 'Block', 'Create',
    'Delete', 'Dislike', 'Flag', 'Follow', 'Ignore', 'Invite', 'Join', 'Leave',
    'Like', 'Listen', 'Move', 'Offer', 'Question', 'Reject', 'Read', 'Remove',
    'TentativeReject', 'TentativeAccept', 'Travel', 'Undo', 'Update', 'View']

  static #actorTypes = ['Application', 'Group', 'Organization', 'Person', 'Service']

  static #objectTypes = [
    'Article', 'Audio', 'Document', 'Event', 'Image', 'Note', 'Page', 'Place',
    'Profile', 'Relationship', 'Tombstone', 'Video']

  static #linkTypes = ['Mention']

  static #knownTypes = [].concat(ActivityObject.#coreTypes, ActivityObject.#activityTypes,
    ActivityObject.#actorTypes, ActivityObject.#objectTypes,
    ActivityObject.#linkTypes)

  static bestType (type) {
    const types = (Array.isArray(type)) ? type : [type]
    for (const item of types) {
      if (item in ActivityObject.#knownTypes) {
        return item
      }
    }
    // TODO: more filtering here?
    return types[0]
  }

  static isActivityType (type) {
    const types = (Array.isArray(type)) ? type : [type]
    return types.some(t => {
      return ['Activity', 'IntransitiveActivity'].includes(t) ||
        ActivityObject.#activityTypes.includes(t)
    })
  }

  static isObjectType (type) {
    const types = (Array.isArray(type)) ? type : [type]
    return types.some(t => {
      return ['Object', 'Link', 'Collection', 'CollectionPage', 'OrderedCollection', 'OrderedCollectionPage'].includes(t) ||
        ActivityObject.#objectTypes.includes(t)
    })
  }

  async cache (owner = null, addressees = null) {
    const dataId = await this.id()
    const data = await this.json()
    if (!owner) {
      owner = ActivityObject.guessOwner(data)
    }
    if (!addressees) {
      addressees = ActivityObject.guessAddressees(data)
    }
    const ownerId = await toId(owner) || data.id
    const addresseeIds = await Promise.all(addressees.map((addressee) => toId(addressee)))
    const qry = 'INSERT OR REPLACE INTO object (id, owner, data) VALUES (?, ?, ?)'
    await db.run(qry, [dataId, ownerId, JSON.stringify(data)])
    await Promise.all(addresseeIds.map(async (addresseeId) =>
      await db.run(
        'INSERT OR IGNORE INTO addressee (objectId, addresseeId) VALUES (?, ?)',
        [dataId, await toId(addresseeId)]
      )))
  }

  async patch (patch) {
    const merged = { ...await this.json(), ...patch, updated: new Date().toISOString() }
    // null means delete
    for (const prop in patch) {
      if (patch[prop] == null) {
        delete merged[prop]
      }
    }
    await db.run(
      'UPDATE object SET data = ? WHERE id = ?',
      [JSON.stringify(merged), await this.id()]
    )
    this.#json = merged
  }

  async replace (replacement) {
    await db.run(
      'UPDATE object SET data = ? WHERE id = ?',
      [JSON.stringify(replacement), await this.id()]
    )
    this.#json = replacement
  }

  async owner () {
    if (!this.#owner) {
      const row = await db.get('SELECT owner FROM object WHERE id = ?', [await this.id()])
      if (!row) {
        this.#owner = null
      } else {
        this.#owner = await ActivityObject.get(row.owner)
      }
    }
    return this.#owner
  }

  async addressees () {
    if (!this.#addressees) {
      const id = await this.id()
      const rows = await db.all('SELECT addresseeId FROM addressee WHERE objectId = ?', [id])
      this.#addressees = await Promise.all(rows.map((row) => ActivityObject.get(row.addresseeId)))
    }
    return this.#addressees
  }

  async canRead (subject) {
    const owner = await this.owner()
    const addressees = await this.addressees()
    const addresseeIds = await Promise.all(addressees.map((addressee) => addressee.id()))
    if (subject && typeof subject !== 'string') {
      throw new Error(`Unexpected subject: ${JSON.stringify(subject)}`)
    }
    // subjects from blocked domains can never read
    if (subject && domainIsBlocked(subject)) {
      return false
    }
    if (subject && await User.isUser(owner)) {
      const blockedProp = await owner.prop('blocked')
      const blocked = new Collection(blockedProp)
      if (await blocked.hasMember(subject)) {
        return false
      }
    }
    // anyone can read if it's public
    if (addresseeIds.includes(PUBLIC)) {
      return true
    }
    // otherwise, unauthenticated can't read
    if (!subject) {
      return false
    }
    // owner can always read
    if (subject === await owner.id()) {
      return true
    }
    // direct addressees can always read
    if (addresseeIds.includes(subject)) {
      return true
    }
    // if they're a member of any addressed collection
    for (const addresseeId of addresseeIds) {
      const obj = await ActivityObject.get(addresseeId)
      if (await obj.isCollection()) {
        const coll = new Collection(obj.json())
        if (await coll.hasMember(subject)) {
          return true
        }
      }
    }
    // Otherwise, can't read
    return false
  }

  async canWrite (subject) {
    const owner = await this.owner()
    // owner can always write
    if (subject === await owner.id()) {
      return true
    }
    // TODO: if we add a way to grant write access
    // to non-owner, add the check here!
    return false
  }

  async brief () {
    const object = await this.json()
    if (!object) {
      return await this.id()
    }
    let brief = {
      id: await this.id(),
      type: await this.type(),
      icon: await this.prop('icon')
    }
    for (const prop of ['nameMap', 'name', 'summaryMap', 'summary']) {
      if (prop in object) {
        brief[prop] = object[prop]
        break
      }
    }
    switch (object.type) {
      case 'Key':
        brief = {
          ...brief,
          owner: object.owner,
          publicKeyPem: object.publicKeyPem
        }
        break
      case 'Note':
        brief = {
          ...brief,
          content: object.content,
          contentMap: object.contentMap
        }
        break
      case 'OrderedCollection':
      case 'Collection':
        brief = {
          ...brief,
          first: object.first
        }
    }
    return brief
  }

  static #idProps = [
    'actor',
    'alsoKnownAs',
    'attachment',
    'attributedTo',
    'anyOf',
    'audience',
    'blocked',
    'cc',
    'context',
    'current',
    'describes',
    'first',
    'following',
    'followers',
    'generator',
    'href',
    'icon',
    'image',
    'inbox',
    'inReplyTo',
    'instrument',
    'last',
    'liked',
    'likes',
    'location',
    'next',
    'object',
    'oneOf',
    'origin',
    'outbox',
    'partOf',
    'pendingFollowers',
    'pendingFollowing',
    'prev',
    'preview',
    'publicKey',
    'relationship',
    'replies',
    'result',
    'shares',
    'subject',
    'tag',
    'target',
    'to',
    'url'
  ]

  static #arrayProps = [
    'items',
    'orderedItems'
  ]

  async expanded () {
    // force a full read
    const id = await this.id()
    if (!id) {
      throw new Error('No id for object being expanded')
    }
    const ao = await ActivityObject.getById(id)
    if (!ao) {
      throw new Error(`No such object: ${id}`)
    }
    const object = await ao.json()
    const toBrief = async (value) => {
      if (value) {
        const obj = new ActivityObject(value)
        return await obj.brief()
      } else {
        return value
      }
    }

    for (const prop of ActivityObject.#idProps) {
      if (prop in object) {
        if (Array.isArray(object[prop])) {
          object[prop] = await Promise.all(object[prop].map(toBrief))
        } else if (prop === 'object' && await this.needsExpandedObject()) {
          object[prop] = await (new ActivityObject(object[prop])).expanded()
        } else {
          object[prop] = await toBrief(object[prop])
        }
      }
    }

    // Fix for PKCS1 format public keys
    if ('publicKeyPem' in object) {
      object.publicKeyPem = toSpki(object.publicKeyPem)
    }

    return object
  }

  async compressed () {
    const object = this.json()
    const toIdOrValue = async (value) => {
      const id = await new ActivityObject(value).id()
      if (id) {
        return id
      } else {
        return value
      }
    }

    for (const prop of ActivityObject.#idProps) {
      if (prop in object) {
        if (Array.isArray(object[prop])) {
          object[prop] = await Promise.all(object[prop].map(toIdOrValue))
        } else {
          object[prop] = await toIdOrValue(object[prop])
        }
      }
    }

    for (const prop of ActivityObject.#arrayProps) {
      if (prop in object) {
        if (Array.isArray(object[prop])) {
          object[prop] = await Promise.all(object[prop].map(toIdOrValue))
        } else {
          object[prop] = await toIdOrValue(object[prop])
        }
      }
    }
    return object
  }

  static async fromActivityObject (object) {
    return new ActivityObject(await object.json())
  }

  defaultType () {
    return 'Object'
  }

  async needsExpandedObject () {
    const needs = ['Create', 'Update', 'Accept', 'Reject', 'Announce']
    const type = await this.type()
    const types = (Array.isArray(type)) ? type : [type]
    return types.some((t) => needs.includes(t))
  }

  async hasProp (prop) {
    const json = await this.json()
    return prop in json
  }

  static isRemoteId (id) {
    return !id.startsWith(ORIGIN)
  }

  static async copyAddresseeProps (to, from) {
    for (const prop of ['to', 'cc', 'bto', 'bcc', 'audience']) {
      const toValues = toArray(to[prop])
      const fromValues = toArray(from[prop])
      const merged = [...toValues, ...fromValues]
      const ids = await Promise.all(merged.map((addressee) => toId(addressee)))
      const unique = [...new Set(ids)]
      if (unique.length > 0) {
        to[prop] = unique
      }
    }
  }

  async ensureAddressee (addressee) {
    const id = await toId(addressee)
    const addressees = await this.addressees()
    for (const a of addressees) {
      if (await a.id() === id) {
        return
      }
    }
    await db.run('INSERT INTO addressee (objectId, addresseeId) VALUES (?, ?)', [await this.id(), id])
  }
}

export default ActivityObject
