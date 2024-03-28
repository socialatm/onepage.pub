import Database from './database.mjs'
import logger from './logger.mjs'
import ActivityObject from './activity-object.mjs'
import Collection from './collection.mjs'

const DATABASE = process.env.OPP_DATABASE
const db = new Database(DATABASE)
const PUBLIC = 'https://www.w3.org/ns/activitystreams#Public'

class User {
    constructor (username, password = null) {
      this.username = username
      this.password = password
    }
  
    async save () {
      this.actorId = await ActivityObject.makeId('Person')
      const data = {
        name: this.username,
        id: this.actorId,
        type: 'Person',
        preferredUsername: this.username,
        attributedTo: this.actorId,
        to: [PUBLIC]
      }
      const props = ['inbox', 'outbox', 'followers', 'following', 'liked']
      for (const prop of props) {
        const coll = await Collection.empty(this.actorId, [PUBLIC], { nameMap: { en: `${this.username}'s ${prop}` } })
        data[prop] = await coll.id()
      }
      const privProps = ['blocked', 'pendingFollowers', 'pendingFollowing']
      for (const prop of privProps) {
        const coll = await Collection.empty(this.actorId, [], { nameMap: { en: `${this.username}'s ${prop}` } })
        data[prop] = await coll.id()
      }
      const { publicKey, privateKey } = await newKeyPair()
      const pkey = new ActivityObject({
        type: 'Key',
        owner: this.actorId,
        to: [PUBLIC],
        publicKeyPem: publicKey
      })
      await pkey.save()
      data.publicKey = await pkey.id()
      const person = new ActivityObject(data)
      await person.save()
      const passwordHash = await bcrypt.hash(this.password, 10)
      await db.run('INSERT INTO user (username, passwordHash, actorId, privateKey) VALUES (?, ?, ?, ?)', [this.username, passwordHash, this.actorId, privateKey])
    }
  
    static async isUser (object) {
      if (!object) {
        return false
      }
      const id = await toId(object)
      const row = await db.get('SELECT actorId FROM user WHERE actorId = ?', [id])
      return !!row
    }
  
    static async usernameExists (username) {
      const row = await db.get('SELECT username FROM user WHERE username = ?', [username])
      return !!row
    }
  
    static async fromActorId (actorId) {
      const row = await db.get('SELECT * FROM user WHERE actorId = ?', [actorId])
      if (!row) {
        return null
      } else {
        return User.fromRow(row)
      }
    }
  
    static async fromUsername (username) {
      const row = await db.get('SELECT * FROM user WHERE username = ?', [username])
      if (!row) {
        return null
      } else {
        return User.fromRow(row)
      }
    }
  
    static async fromRow (row) {
      const user = new User(row.username)
      user.actorId = row.actorId
      user.privateKey = row.privateKey
      return user
    }
  
    async getActor (username) {
      const actor = new ActivityObject(this.actorId)
      return actor
    }
  
    static async authenticate (username, password) {
      const row = await db.get('SELECT * FROM user WHERE username = ?', [username])
      if (!row) {
        return null
      }
      if (!await bcrypt.compare(password, row.passwordHash)) {
        return null
      }
      return User.fromRow(row)
    }
  
    static async updateAllKeys () {
      // TODO: change this to use a cursor
      const rows = await db.all('SELECT * FROM user where privateKey LIKE \'-----BEGIN RSA PRIVATE KEY-----%\'')
      for (const row of rows) {
        const actor = new ActivityObject(row.actorId)
        const publicKey = new ActivityObject(await actor.prop('publicKey'))
        const newPublicKeyPem = toSpki(await publicKey.prop('publicKeyPem'))
        const newPrivateKeyPem = toPkcs8(row.privateKey)
        logger.info(`Updating keys for ${row.actorId}`)
        await publicKey.patch({ publicKeyPem: newPublicKeyPem })
        await actor.patch({ publicKey: await publicKey.id() })
        await db.run('UPDATE user SET privateKey = ? WHERE actorId = ?', [newPrivateKeyPem, row.actorId])
      }
    }
  }

  export default User