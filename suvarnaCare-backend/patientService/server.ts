// server.ts
import http from 'http' // Your exact requested import style
import app from './src/app'

const PORT: number | string = process.env.PORT || 5000

// Use http directly to instantiate your server instance
const server = http.createServer(app)

const startServer = async (): Promise<void> => {
  try {
    server.listen(PORT, () => {
      console.log(`🚀 TS Server running on port ${PORT}`)
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ Server failed to start:', message)
    process.exit(1)
  }
}

process.on('unhandledRejection', (err: Error) => {
  console.error(`💥 Unhandled Rejection: ${err.message}`)
  server.close(() => process.exit(1))
})

startServer()
