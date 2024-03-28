const HOSTNAME = process.env.OPP_HOSTNAME
const PORT = process.env.OPP_PORT
const ORIGIN = process.env.OPP_ORIGIN || ((PORT === 443) ? `https://${HOSTNAME}` : `https://${HOSTNAME}:${PORT}`)

function makeUrl (relative) {
    if (relative.length > 0 && relative[0] === '/') {
      relative = relative.slice(1)
    }
    return `${ORIGIN}/${relative}`
  }

  export {
    makeUrl
  }
  