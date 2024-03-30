import { Router } from 'express'
import page from '../modules/page.mjs'
import passport from 'passport'
import limiter from '../modules/rate-limit.mjs'

const router = Router()
router.use(limiter)

router.get('/',  wrap(async (req, res) => {
  res.type('html')
  res.status(200)
  const loginHtml = `
    <div class="container-fluid position-absolute top-50 start-50 translate-middle">
      <div class="row my-2">
        <div class="col border border-primary rounded mx-2 p-3">  
          <form method="POST" action="/login">
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
            <div class="form-group row">
              <div class="col-sm-4">
              </div> <!-- Empty space equivalent to label width -->
              <div class="col-sm-8">
                <button type="submit" class="btn btn-primary">Login</button>
                <a href='/' class="btn btn-secondary">Cancel</a>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
  res.send(page('Login', loginHtml, user))
}))

// post starts here
router.post('/', (req, res, next) => {
  const redirectTo = req.session.redirectTo
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      res.redirect('/login?error=1')
      return
    }
    if (!user) {
      res.redirect('/login')
      return
    }
    req.login(user, (err) => {
      if (err) {
        next(err)
        return
      }
      if (redirectTo) {
        res.redirect(redirectTo)
      } else {
        res.redirect('/inbox')
      }
    })
  })(req, res, next)
})

// post ends here

export default router
