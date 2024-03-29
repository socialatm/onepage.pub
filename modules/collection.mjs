import ActivityObject from './activity-object.mjs'
import { toId } from '../index.mjs'

const isString = value => typeof value === 'string' || value instanceof String

class Collection extends ActivityObject {
    static async get (id, props = null, actor = null) {
      const ao = await super.get(id, props, actor)
      if (ao) {
        return Collection.fromActivityObject(ao)
      } else {
        return null
      }
    }
  
    static async fromActivityObject (object) {
      const coll = new Collection(await object.json())
      return coll
    }
  
    async hasMember (object) {
      await this.expand()
      const objectId = await toId(object)
      const match = (item) => ((isString(item) && item === objectId) || ((typeof item === 'object') && item.id === objectId))
      if (await this.hasProp('orderedItems')) {
        const orderedItems = await this.prop('orderedItems')
        return orderedItems.some(match)
      } else if (await this.hasProp('items')) {
        const items = await this.prop('items')
        return items.some(match)
      } else if (await this.hasProp('first')) {
        let page = null
        for (let pageId = await this.prop('first');
          pageId;
          pageId = await page.prop('next')) {
          page = new ActivityObject(pageId)
          await page.expand()
          if (await page.hasProp('orderedItems')) {
            const orderedItems = await page.prop('orderedItems')
            if (orderedItems.some(match)) {
              return true
            }
          } else if (await page.hasProp('items')) {
            const items = await page.prop('items')
            if (items.some(match)) {
              return true
            }
          }
        }
        return false
      }
    }
  
    async prependData (data) {
      return await this.prepend(new ActivityObject(data))
    }
  
    async prepend (object) {
      await this.expand()
      const collection = await this.json()
      const objectId = await object.id()
      if (collection.orderedItems) {
        await this.patch({ totalItems: collection.totalItems + 1, orderedItems: [objectId, ...collection.orderedItems] })
      } else if (collection.items) {
        await this.patch({ totalItems: collection.totalItems + 1, items: [objectId, ...collection.items] })
      } else if (collection.first) {
        const first = new ActivityObject(collection.first)
        await first.expand()
        const firstJson = await first.json()
        const ip = ['orderedItems', 'items'].find(p => p in firstJson)
        if (!ip) {
          throw new Error('No items or orderedItems in first page')
        }
        if (firstJson[ip].length < MAX_PAGE_SIZE) {
          const patch = {}
          patch[ip] = [objectId, ...firstJson[ip]]
          await first.patch(patch)
          await this.patch({ totalItems: collection.totalItems + 1 })
        } else {
          const owner = await this.owner()
          const props = {
            type: firstJson.type,
            partOf: collection.id,
            next: firstJson.id,
            attributedTo: owner
          }
          await ActivityObject.copyAddresseeProps(props, await this.json())
          props[ip] = [objectId]
          const newFirst = new ActivityObject(props)
          await newFirst.save()
          await this.patch({ totalItems: collection.totalItems + 1, first: await newFirst.id() })
          await first.patch({ prev: await newFirst.id() })
        }
      }
    }
  
    async removeData (data) {
      return this.remove(new ActivityObject(data))
    }
  
    async remove (object) {
      const collection = await this.expanded()
      const objectId = await object.id()
      if (Array.isArray(collection.orderedItems)) {
        const i = collection.orderedItems.indexOf(objectId)
        if (i !== -1) {
          collection.orderedItems.splice(i, 1)
          await this.patch({
            totalItems: collection.totalItems - 1,
            orderedItems: collection.orderedItems
          })
        }
      } else if (Array.isArray(collection.items)) {
        const i = collection.items.indexOf(objectId)
        if (i !== -1) {
          collection.items.splice(i, 1)
          await this.patch({ totalItems: collection.totalItems - 1, items: collection.items })
        }
      } else {
        let ref = collection.first
        while (ref) {
          const page = new ActivityObject(ref)
          const json = await page.expanded()
          for (const prop of ['items', 'orderedItems']) {
            if (json[prop]) {
              const i = json[prop].indexOf(objectId)
              if (i !== -1) {
                const patch = {}
                json[prop].splice(i, 1)
                patch[prop] = json[prop]
                await page.patch(patch)
                await this.patch({ totalItems: collection.totalItems - 1 })
                return
              }
            }
          }
          ref = json.next
        }
      }
      return collection
    }
  
    async members () {
      await this.expand()
      if (await this.hasProp('orderedItems')) {
        return await this.prop('orderedItems')
      } else if (await this.hasProp('items')) {
        return await this.prop('items')
      } else if (await this.hasProp('first')) {
        const members = []
        let ref = await this.prop('first')
        while (ref) {
          const page = new ActivityObject(ref)
          await page.expand()
          if (await page.hasProp('orderedItems')) {
            members.push(...(await page.prop('orderedItems')))
          } else if (await page.hasProp('items')) {
            members.push(...(await page.prop('items')))
          }
          ref = await page.prop('next')
        }
        return members
      }
    }
  
    static async empty (owner, addressees, props = {}, pageProps = {}) {
      const id = await ActivityObject.makeId('OrderedCollection')
      const page = new ActivityObject({
        type: 'OrderedCollectionPage',
        orderedItems: [],
        partOf: id,
        attributedTo: owner,
        to: addressees,
        ...pageProps
      })
      await page.save()
      const coll = new ActivityObject({
        id,
        type: 'OrderedCollection',
        totalItems: 0,
        first: await page.id(),
        last: await page.id(),
        attributedTo: owner,
        to: addressees,
        ...props
      })
      await coll.save()
      return coll
    }
  
    async find (test) {
      let ref = this.prop('first')
      while (ref) {
        const page = new ActivityObject(ref)
        if (!await page.isCollectionPage()) {
          break
        }
        const items = (await page.prop('items') || await page.prop('orderedItems') || [])
        for (const item of items) {
          const itemObj = new ActivityObject(item)
          const result = await test(itemObj)
          if (result) {
            return result
          }
        }
        ref = await page.prop('next')
      }
      return false
    }
  
    defaultType () {
      return 'OrderedCollection'
    }
  }

  export default Collection