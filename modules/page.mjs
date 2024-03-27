const HOSTNAME = process.env.OPP_HOSTNAME
const PORT = process.env.OPP_PORT
const ORIGIN = process.env.OPP_ORIGIN || ((PORT === 443) ? `https://${HOSTNAME}` : `https://${HOSTNAME}:${PORT}`)
const NAME = process.env.OPP_NAME || (new URL(ORIGIN)).hostname

const page = (title, body, user = null) => {
    const pageHTML = `<!DOCTYPE html>
    <html lang="en" data-bs-theme="dark">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${title} - ${NAME}</title>
        <script src="theme/color-modes.js"></script>
        <script src="axios/axios.min.js"></script>
        <link rel="stylesheet" href="/bootswatch/united/bootstrap.min.css">
        <link rel="stylesheet" href="/icons/bootstrap-icons.min.css">
      </head>
      <body>
        <nav class="navbar navbar-expand-md sticky-top bg-primary"> <!-- start the navbar -->
          <div class="container-fluid">
            <a href="/" class="navbar-brand">${NAME} <i class="bi bi-alarm"></i></a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarResponsive" aria-controls="navbarResponsive" aria-expanded="false" aria-label="Toggle navigation">
              <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarResponsive">
              <ul class="navbar-nav">
                ${(user)? ` <!-- show this if user is logged in -->
                `
                : ` <!-- show this if user is not logged in -->
                <li class="nav-item active">
                  <a class="nav-link" href="/register">Register</a>
                </li>
                <li class="nav-item active">
                  <a class="nav-link" href="/login">Log in</a>
                </li>
                `}  <!-- end show this if user logged in -->
                <li class="nav-item">
                  <a class="nav-link" href="/help/">Help</a>
                </li>
              </ul>
              <ul class="navbar-nav ms-md-auto">
                <li class="nav-item">
                  <a target="_blank" rel="noopener" class="nav-link" href="https://github.com/socialatm/onepage.pub"><i class="bi bi-github"></i><span class="d-md-none ms-2">GitHub</span></a>
                </li>
                <li class="nav-item">
                  <a target="_blank" rel="noopener" class="nav-link" href="https://twitter.com/bootswatch"><i class="bi bi-twitter"></i><span class="d-md-none ms-2">Twitter</span></a>
                </li>
                <!-- start req.isAuthenticated() here -->
                ${(user)? `
                <li class="nav-item">
                  <a target="_blank" rel="noopener" class="nav-link" href=""><i class="bi bi-bell-fill"></i><span class="d-md-none ms-2">Notifications</span></a>
                </li>
                <li class="nav-item py-2 py-md-1 col-12 col-md-auto">
                  <div class="vr d-none d-md-flex h-100 mx-md-2">
                  </div>
                  <hr class="d-md-none my-2">
                </li>
                <li class="nav-item dropdown">
                  <a class="nav-link dropdown-toggle d-flex align-items-center" href="" id="profile-menu" aria-expanded="false" data-bs-toggle="dropdown" data-bs-display="static" aria-label="Toggle theme">
                    <span>
                      <img src="/img/ray.jpg" class="rounded-circle" alt="${user.username}" style="height: 1.5rem">
                    </span>
                    <span class="d-md-none ms-2">Profile Menu 
                    </span>
                  </a>
                  <ul class="dropdown-menu dropdown-menu-end">
                    <li>
                      <a href="${ORIGIN}/actor" class="dropdown-item d-flex align-items-center justify-content-between" aria-current="true">
                        <span class="ms-2">Profile</span><i class="bi bi-check"></i>
                      </a>
                    </li>
                    <li>
                      <a href="${ORIGIN}/actor/settings" class="dropdown-item d-flex align-items-center justify-content-between">
                        <span class="ms-2">Settings</span>
                      </a>
                    </li>
                    <li>
                      <a href="${ORIGIN}/help" class="dropdown-item d-flex align-items-center justify-content-between">
                        <span class="ms-2">Help</span>
                      </a>
                    </li>
                    <li>
                      <a href="${ORIGIN}/feedback" class="dropdown-item d-flex align-items-center justify-content-between">
                        <span class="ms-2">Feedback</span>
                      </a>
                    </li>
                    <li>
                      <hr class="dropdown-divider">
                    </li>
                    <li>
                      <a href="/logout" class="dropdown-item d-flex align-items-center justify-content-between">
                        <span class="ms-2">Logout</span>
                      </a>
                    </li>
                  </ul>
                </li>
                ` : ``}
                <!-- end req.isAuthenticated()?s here -->
                <li class="nav-item py-2 py-md-1 col-12 col-md-auto">
                  <div class="vr d-none d-md-flex h-100 mx-md-2"></div>
                  <hr class="d-md-none my-2">
                </li>
                <li class="nav-item dropdown">
                  <a class="nav-link dropdown-toggle d-flex align-items-center" href="https://bootswatch.com/united/#" id="theme-menu" aria-expanded="false" data-bs-toggle="dropdown" data-bs-display="static" aria-label="Toggle theme">
                    <i class="bi bi-circle-half"></i>
                    <span class="d-md-none ms-2">Toggle theme</span>
                  </a>
                  <ul class="dropdown-menu dropdown-menu-end">
                    <li>
                      <button type="button" class="dropdown-item d-flex align-items-center" data-bs-theme-value="light" aria-pressed="false">
                        <i class="bi bi-sun-fill"></i><span class="ms-2">Light</span>
                      </button>
                    </li>
                    <li>
                      <button type="button" class="dropdown-item d-flex align-items-center" data-bs-theme-value="dark" aria-pressed="true">
                        <i class="bi bi-moon-stars-fill"></i><span class="ms-2">Dark</span>
                      </button>
                    </li>
                  </ul>
                </li>
              </ul>
            </div>
          </div>
        </nav>  <!-- end navbar -->
          ${body}
        <!-- only show footer if user is not logged in -->
        ${(user)? `` : `
        <footer class="footer fixed-bottom mt-auto py-3 bg-body-tertiary">
          <div class="container">
            <span>
              One Page Pub &copy; 2024
              <a href="https://github.com/socialatm/onepage.pub" target="_blank">GitHub</a>
            </span>
          </div>
        </footer>
        `}
        <!-- end only show footer if user is not logged in -->
        <script src="/popper/popper.min.js"></script>
        <script src="/bootstrap/js/bootstrap.min.js"></script>
      </body>
    </html>`;
    return pageHTML
  }

  export default page
