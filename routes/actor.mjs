import { Router } from 'express'
import page from '../modules/page.mjs'
import passport from 'passport'
const router = Router()

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

  const actorHtml = `<div>Profile Page</div>`
  res.send(page('Actor', actorHtml, user));
});

router.get('/settings',  passport.authenticate('session'), (req, res) => {
  if (!req.isAuthenticated()) {
    logger.error('Not authenticated')
    res.redirect('/login')
  }

  const user = req.user
  if (!user) {
    throw new createError.InternalServerError('Invalid user even though isAuthenticated() is true')
    res.redirect('/login')
  }

  const settingsHtml = `<div>Settings Page</div>`
  res.send(page('Settings', settingsHtml, user));
});

export default router
