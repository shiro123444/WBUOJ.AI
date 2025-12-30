import app from './app.js'
import { config } from './config/index.js'
import { connectDatabase, disconnectDatabase } from './config/database.js'
import { disconnectRedis } from './config/redis.js'
import { judgeService, submissionWsService } from './services/index.js'
import { createServer } from 'http'

async function main() {
  // Connect to database
  await connectDatabase()

  // Create HTTP server
  const server = createServer(app)

  // Initialize Judge WebSocket server (for hydrojudge)
  judgeService.initialize(server)

  // Initialize Submission WebSocket server (for frontend)
  submissionWsService.initialize(server)

  // Start server
  server.listen(config.port, () => {
    console.log(`🚀 Server running on http://localhost:${config.port}`)
    console.log(`📝 Environment: ${config.nodeEnv}`)
  })

  // Graceful shutdown
  const shutdown = async () => {
    console.log('\n🛑 Shutting down gracefully...')

    // Close judge service
    judgeService.close()

    // Close submission WebSocket service
    submissionWsService.close()

    server.close(async () => {
      await disconnectDatabase()
      await disconnectRedis()
      console.log('👋 Server closed')
      process.exit(0)
    })

    // Force close after 10 seconds
    setTimeout(() => {
      console.error('⚠️ Forcing shutdown...')
      process.exit(1)
    }, 10000)
  }

  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)
}

main().catch(err => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
