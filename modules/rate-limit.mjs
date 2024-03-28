import rateLimit from 'express-rate-limit'

const RATE_LIMIT = process.env.OPP_RATE_LIMIT

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: RATE_LIMIT, // Limit each IP to 900 requests per `window` (here, per 15 minutes). Equals 1 per second.
	standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
	// store: ... , // Use an external store for consistency across multiple server instances.
})

export default limiter