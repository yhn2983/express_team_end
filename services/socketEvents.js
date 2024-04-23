// socketEvents.js
let chatUser = [] // 儲存聊天室的用戶

function socketEvents(io) {
  io.on('connection', (socket) => {
    console.log(`⚡: ${socket.id} 用戶已經連接!`) // 當新的用戶連接時，打印出他的 ID

    socket.on('newUser', (data) => {
      const { connectionState } = data
      console.log(data)
      const roomId = connectionState.roomId
      // 將用戶加入到對應的房間
      socket.join(`room${roomId}`)
      console.log(`User has joined room ${roomId}`)
      // 打印出 socket 目前加入的所有房間
      console.log(socket.rooms)
    })

    socket.on('message', (data) => {
      console.log(data) // 打印出收到的消息
      io.emit('messageResponse', data) // 將收到的消息發送給所有用戶
      /*
      const roomId = data.connectionState.roomId
      io.to(`room${roomId}`).emit('messageResponse', data) // 將收到的消息發送給該房間的所有用戶
      */
    })

    socket.on('typing', (data) => socket.broadcast.emit('typingResponse', data)) // 當用戶正在輸入時，通知其他用戶

    // socket.on('newUser', (data) => {
    //   chatUser.push(data) // 將新用戶添加到用戶列表
    //   io.emit('newUserResponse', chatUser) // 將更新後的用戶列表發送給所有用戶
    // })

    socket.on('disconnect', () => {
      console.log('🔥: 一個用戶已經斷開連接') // 當用戶斷開連接時，打印出消息
      chatUser = chatUser.filter((user) => user.socketID !== socket.id) // 從用戶列表中移除已斷開連接的用戶
      io.emit('newUserResponse', chatUser) // 將更新後的用戶列表發送給所有用戶
    })
  })
}

export default socketEvents // 將 socketEvents 函數導出，以便在其他模組中使用
