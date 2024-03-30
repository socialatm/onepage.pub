import { Router } from 'express'
import page from '../modules/page.mjs'
import limiter from '../modules/rate-limit.mjs'

const router = Router()
router.use(limiter)
const user = null

router.get('/', (req, res) => {
  const helpHtml = `<div>Help Page</div>`
  res.send(page('Help', helpHtml, user));
});

export default router
