import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import { config } from './config/index.js'
import { errorHandler } from './middlewares/index.js'
import routes from './routes/index.js'
import hydroCompatRouter from './routes/hydro-compat.js'

const app = express()

// Security middleware
app.use(helmet())
app.use(
  cors({
    origin: config.isDev ? '*' : ['http://localhost:5173'],
    credentials: true,
  })
)

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { success: false, error: 'Too many requests, please try again later' },
})
app.use('/api', limiter)

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Logging
if (config.isDev) {
  app.use(morgan('dev'))
} else {
  app.use(morgan('combined'))
}

// Hydro OJ 兼容路由 (挂载在根路径，供 hydrojudge 使用)
app.use('/', hydroCompatRouter)

// Routes
app.use('/api', routes)

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    name: 'AI Club OJ API',
    version: '1.0.0',
    status: 'running',
  })
})

// Error handling
app.use(errorHandler)

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    code: 'NOT_FOUND',
  })
})

export default app
