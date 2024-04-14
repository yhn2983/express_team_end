/**
 * Module dependencies.
 */

import app from '../app.js'
import debugLib from 'debug'
import http from 'http'
const debug = debugLib('node-express-es6:server')
import { Server } from 'socket.io'
import socketEvents from '##/services/socketEvents.js'
// import { exit } from 'node:process'

// 導入dotenv 使用 .env 檔案中的設定值 process.env
import 'dotenv/config.js'

/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.WEB_PORT2 || '6005')
app.set('port', port)

/**
 * Create HTTP server.
 */

var server = http.createServer(app)

// 建立 Socket.IO 伺服器
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'https://localhost:9000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
})

// 將 io 物件附加到 Express 應用程式上
app.io = io
socketEvents(io) // 將 io 物件傳遞給 socketEvents 函數
/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port)
server.on('error', onError)
server.on('listening', onListening)

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10)

  if (isNaN(port)) {
    // named pipe
    return val
  }

  if (port >= 0) {
    // port number
    return port
  }

  return false
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error
  }

  var bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges')
      exit(1)
      break
    case 'EADDRINUSE':
      console.error(bind + ' is already in use')
      exit(1)
      break
    default:
      throw error
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address()
  var bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port
  debug('Listening on ' + bind)
}
