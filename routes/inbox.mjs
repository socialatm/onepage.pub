import { Router } from 'express'
import page from '../modules/page.mjs'
import limiter from '../modules/rate-limit.mjs'
import passport from 'passport'
import wrap from 'express-async-handler'
import axios from 'axios'
import jwt from 'jsonwebtoken'
import { promisify } from 'util'
import { nanoid } from 'nanoid'
import { makeUrl } from '../index.mjs'
import Server from '../modules/server.mjs'

const router = Router()
router.use(limiter)
const jwtsign = promisify(jwt.sign)
const AS_CONTEXT = 'https://www.w3.org/ns/activitystreams'
const PUBLIC = 'https://www.w3.org/ns/activitystreams#Public'

router.use(wrap(async (req, res, next) => {
  const server = await Server.get()
  req.jwtKeyData = server.privateKey()
  return next()
}))

router.get('/', passport.authenticate('session'), wrap(async (req, res) => {
  if (!req.isAuthenticated()) {
    logger.error('Not authenticated')
    res.redirect('/login')
  }

  const user = req.user
  if (!user) {
    throw new createError.InternalServerError('Invalid user even though isAuthenticated() is true')
    res.redirect('/login')
  }

  if (process.env.NODE_ENV != 'production') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0
  }

  /**
   * Fetches data for a given actor ID.
   * @param {string} actorId - The ID of the actor.
   * @returns {Promise<any>} - A promise that resolves to the fetched data.
   */
  async function fetchData(actorId) {
    try {
      const response = await axios.get(actorId);
      return response.data;
    } catch (err) {
      console.log("Unable to fetch -", err);
    }
  }
  
  const responseData = await fetchData(user.actorId);
  
  // keep this here for debugging purposes
  // console.log(JSON.stringify(responseData, null, 2));

  const outbox = responseData.outbox
  const followers = responseData.followers
  
  /**
   * JSON Web Token (JWT) representing the access token.
   * @type {string}
   */
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

  res.type('html')
  res.status(200)
  res.setHeader('Set-Cookie', `jwtToken=${token}; Secure; SameSite=Lax`);
  const inboxHtml =`
  <!-- start inboxHtml here -->
  <div class="container-fluid">
    <div class="row my-2">
      <div class="col ">  <!-- start left column -->
        <div class="card my-3">
          <div class="card-body">
            <div class="fs-5">@RayPeaslee
            </div>
            <div class="fs-6 text-muted">Fullname : Raymond E Peaslee
            </div>
            <div class="fs-6">
              Developer of web applications, JavaScript, PHP, Java, Python, Ruby, Java, Node.js, etc.
            </div>
          </div>
          <ul class="list-group list-group-flush">
            <li class="list-group-item">
              <div class="fs-6 text-muted">Followers
              </div>
              <div class="fs-5">5.2342
              </div>
            </li>
            <li class="list-group-item">
              <div class="fs-6 text-muted">Following
              </div>
              <div class="fs-5">6758
              </div>
            </li>
            <li class="list-group-item">Vestibulum at eros
            </li>
          </ul>
        </div>
      </div>  <!-- end left column -->
      
      <div class="col-md-6 mt-3">  <!-- start center column -->
        <!-- start inbox -->
        <div>
          <!-- start post form-->
          <form id="createPostForm">
            <input type="hidden" id="outbox" name="outbox" value=${outbox}>
            <input type="hidden" id="@context" name="@context" value="${AS_CONTEXT}">
            <input type="hidden" id="type" name="type" value="Note">
            <input type="hidden" id="attributedTo" name="attributedTo" value="${user.actorId}">
            <div class="mb-3">
              <textarea class="form-control" id="content" name="content" rows="3"></textarea>
            </div>
            <select class="form-select" aria-label="Default select example" id="to" name="to">
              <option value="${user.actorId}">Just Me</option>
              <option value="${followers}">My Followers</option>
              <option selected value="${PUBLIC}">Public</option>
            </select>
            <button id="createPostSubmitBtn" type="submit" class="btn btn-primary btn-sm my-3">Submit</button>
          </form>
          <!-- end post form -->
          <div id="feed">
            <!-- actual inbox will go here -->
          </div>
          <div class="card">
            <div class="card-body">
              <div class="d-flex mb-3">
                <a href="${user.actorId}">
                  <img src="/img/ray.jpg" class="border rounded-circle me-2 img-fluid" alt="profile picture" style="height: 2.5rem">
                </a>
              <div>
              <a href="${user.actorId}" class="link-underline link-underline-opacity-0 link-underline-opacity-100-hover mb-0">
                ${user.username}
              </a>
              <p class="text-muted d-inline">
                10h ago
              </p>
            </div>
          </div>
          <div>
            <p>
              Lorem ipsum, dolor sit amet consectetur adipisicing
              elit. Atque ex non impedit corporis sunt nisi nam fuga
              dolor est, saepe vitae delectus fugit, accusantium qui
              nulla aut adipisci provident praesentium?
            </p>
          </div>
        </div>
        <div>
          <img src="/img/greg-moore.jpg" class="img-fluid" alt="picture">
        </div>
        <div class="card-body">
          <div class="d-flex justify-content-between mb-3">
            <div>
              <a href="" class="link-underline link-underline-opacity-0 link-underline-opacity-100-hover">
                <i class="bi bi-hand-thumbs-up text-primary"></i>
                <span>124</span>
              </a>
            </div>
            <div>
              <a href="" class="text-muted link-underline link-underline-opacity-0 link-underline-opacity-100-hover"> 8 comments </a>
            </div>
          </div>
          <div class="d-flex justify-content-between text-center border-top border-bottom mb-4">
            <button type="button" class="btn btn-link btn-md link-underline link-underline-opacity-0 link-underline-opacity-100-hover">
              <i class="bi bi-hand-thumbs-up"></i> Like
            </button>
            <button type="button" class="btn btn-link btn-md link-underline link-underline-opacity-0 link-underline-opacity-100-hover">
              <i class="bi bi-chat"></i> Comment
            </button>
            <button type="button" class="btn btn-link btn-md link-underline link-underline-opacity-0 link-underline-opacity-100-hover">
              <i class="bi bi-share"></i> Share
            </button>
          </div>
            <!-- start comment form -->
          <div class="d-flex mb-3">
            <a href="${user.actorId}">
              <img src="/img/ray.jpg" class="border rounded-circle me-2" alt="Avatar" style="height: 2.5rem">
            </a>
            <div class="form-outline w-100">
              <textarea class="form-control" id="textAreaExample" rows="2"></textarea>
              <label class="form-label" for="textAreaExample">Write a comment</label>
            </div>
          </div>
            <!-- end comment form -->
            <!-- start comment template -->
          <div class="d-flex mb-3">
            <a href="">
              <img src="/img/einstein.jpg" class="border rounded-circle me-2" alt="Avatar" style="height: 2.5rem">
            </a>
            <div>
              <div class="border rounded-3 px-3 py-1">
                <a href="" class="link-underline link-underline-opacity-0 link-underline-opacity-100-hover mb-0">
                  Albert Einstein
                </a>
                <p>
                  Put your hand on a hot stove for a minute and it seems like an hour. Sit with a pretty girl for an hour, and it seems like a minute.
                </p>
              </div>
                <a href="" class="text-muted mx-2 fs-6 link-underline link-underline-opacity-0 link-underline-opacity-100-hover">Like</a>
                <a href="" class="text-muted mx-2 fs-6 link-underline link-underline-opacity-0 link-underline-opacity-100-hover">Reply</a>
            </div>
          </div>
            <!-- end comment template -->
        </div>
        </div>
        </div>
      </div>  <!-- end center column -->

      <div class="col ">  <!-- start right column -->
        <div class="card mt-3">
          <div class="card-body">
            <h5 class="card-title">Card title</h5>
            <h6 class="card-subtitle mb-2 text-body-secondary">Card subtitle</h6>
            <p class="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p>
            <a href="#" class="card-link">Card link</a>
            <a href="#" class="card-link">Another link</a>
          </div>
        </div>
        <div class="card mt-3">
          <div class="card-body">
            <h5 class="card-title">Card title</h5>
            <h6 class="card-subtitle mb-2 text-body-secondary">Card subtitle</h6>
            <p class="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p>
            <a href="#" class="card-link">Card link</a>
            <a href="#" class="card-link">Another link</a>
          </div>
        </div>
      </div>  <!-- end right column -->
    </div>
  </div>
  <script src="js/create.note.js"></script>
  `;
  res.end(page('Inbox', inboxHtml, user))
}))

export default router
