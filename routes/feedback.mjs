import { Router } from 'express'
import page from '../modules/page.mjs'
import passport from 'passport'
import limiter from '../modules/rate-limit.mjs'

const router = Router()
router.use(limiter)

router.get('/',  passport.authenticate('session'), (req, res) => {
  if (!req.isAuthenticated()) {
    logger.error('Not authenticated')
    res.redirect('/login')
  }

  const user = req.user
  if (!user) {
    throw new createError.InternalServerError('Invalid user even though isAuthenticated() is true')
    res.redirect('/login')
  }

  const feedbackHtml = `<div>Feedback Page</div>`
  res.send(page('Feedback', feedbackHtml, user));
});

export default router
