import { Router } from 'express'
import page from '../modules/page.mjs'
import limiter from '../modules/rate-limit.mjs'
import wrap from 'express-async-handler'
import User from '../modules/user.mjs'
import { makeUrl } from '../modules/utilities.mjs'
import { nanoid } from 'nanoid'
import { promisify } from 'util'
import jwt from 'jsonwebtoken'
import createError from 'http-errors'
import Server from '../modules/server.mjs'
import passport from 'passport'
import LocalStrategy from 'passport-local'

const INVITE_CODE = process.env.OPP_INVITE_CODE
const jwtsign = promisify(jwt.sign)
const router = Router()
router.use(limiter)
router.use(passport.initialize()) // Initialize Passport
router.use(passport.session())

router.use(wrap(async (req, res, next) => {
  const server = await Server.get()
  req.jwtKeyData = server.privateKey()
  return next()
}))

router.get('/', wrap(async (req, res) => {
  res.type('html')
  res.status(200)
  res.end(page('Register', `
    <div class="container mx-auto position-absolute top-50 start-50 translate-middle">
    <form method="POST" action="/register">
      ${(!INVITE_CODE || INVITE_CODE.length === 0)
        ? ''
        : `
        <div class="container-fluid">
          <div class="row my-2">
            <div class="col border border-primary rounded ms-2 py-3">
              <div class="form-group row mb-3">
                <label for="invitecode" class="col-sm-4 col-form-label text-right">Invite code</label>
                <div class="col-sm-8">
                  <input type="text" name="invitecode" id="invitecode" class="form-control" placeholder="Invite code" />
                </div>
              </div>`}
              <div class="form-group row mb-3">
                <label for="username" class="col-sm-4 col-form-label text-right">Username</label>
                <div class="col-sm-8">
                  <input type="text" name="username" id="username" class="form-control" placeholder="Username">
                </div>
              </div>
              <div class="form-group row mb-3">
                <label for="password" class="col-sm-4 col-form-label text-right">Password</label>
                <div class="col-sm-8">
                  <input type="password" class="form-control" name="password" id="password">
                </div>
              </div>
              <div class="form-group row mb-3">
                <label for="confirmation" class="col-sm-4 col-form-label text-right">Confirm</label>
                <div class="col-sm-8">
                  <input type="password" class="form-control" name="confirmation" id="confirmation">
                </div>
              </div>
              <div class="form-group row">
                <div class="col-sm-4"></div> <!-- Empty space equivalent to label width -->
                  <div class="col-sm-8">
                    <button type="submit" class="btn btn-primary">Register</button>
                    <a href='/' class="btn btn-secondary">Cancel</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
  `))
}))

router.post('/', wrap(async (req, res) => {
  if (req.get('Content-Type') !== 'application/x-www-form-urlencoded') {
    throw new createError.BadRequest('Invalid Content-Type')
  }
  if (!req.body.username) {
    throw new createError.BadRequest('Username is required')
  }
  if (!req.body.password) {
    throw new createError.BadRequest('Password is required')
  }
  if (req.body.password !== req.body.confirmation) {
    throw new createError.BadRequest('Passwords do not match')
  }
  if (INVITE_CODE && INVITE_CODE.length > 0 && (!req.body.invitecode || req.body.invitecode !== INVITE_CODE)) {
    throw new createError.BadRequest('Correct invite code required')
  }
  const username = req.body.username

  if (await User.usernameExists(username)) {
    throw new createError.BadRequest('Username already exists')
  }

  const password = req.body.password
  const user = new User(username, password)
  await user.save()
  const token = await jwtsign(
    {
      jwtid: nanoid(),
      type: 'access',
      subject: user.actorId,
      scope: 'read write',
      issuer: makeUrl('')
    },
    req.jwtKeyData,
    { algorithm: 'RS256' }
  )
  
  req.login(user, (err) => {
    if (err) {
      throw new createError.InternalServerError('Failed to login')
    }
    res.type('html')
    res.status(200)
    res.end(page('Registered', `
      <div class="container-fluid">
        <div class="row my-2">
          <div class="col border border-primary rounded ms-2">
            <p>
              Registered <a class="actor" href="${user.actorId}">${username}</a>
            </p>
            <p>
              Personal access token is <span class="token">${token}</span>
            </p>
            <p>
              <a href="/inbox" class="btn btn-primary">Inbox</a>
            </p>
          </div>
        </div>
      </div>
      `, user))
  })
}))

export default router
