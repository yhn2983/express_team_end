import express from 'express'
const router = express.Router()
import authenticate from '#middlewares/authenticate.js'
import sequelize from '#configs/db.js'
import { Op } from 'sequelize'
// 存取`.env`設定檔案使用
import 'dotenv/config.js'
const { Room } = sequelize.models
const { Message } = sequelize.models

router.post('/', (req, res) => {
  const io = req.app.io
  // 你可以在這裡使用 `io` 來發送事件或訊息
  res.json({ message: 'Chat route' })
})

router.post('/rooms', async (req, res) => {
  const { user1_id, user2_id } = req.body

  // 檢查 user1_id 和 user2_id 是否相同
  if (user1_id === user2_id) {
    return res.json({ status: 'error', message: '不能跟自己對話!' })
  }
  try {
    // 檢查是否已經存在相同的聊天室
    let room = await Room.findOne({
      where: {
        user1_id: {
          [Op.or]: [user1_id, user2_id],
        },
        user2_id: {
          [Op.or]: [user1_id, user2_id],
        },
      },
    })

    // 如果不存在，則創建新的聊天室
    if (!room) {
      room = await Room.create({ user1_id, user2_id })
    }

    res.json({ status: 'success', data: room })
  } catch (error) {
    res.json({ status: 'error', message: error.message })
  }
})

router.post('/postmessage', async (req, res) => {
  try {
    // 從請求體中獲取訊息資訊
    const { text, name, id, socketID, connectionState } = req.body

    // 創建新的訊息
    const message = await Message.create({
      room_id: connectionState.roomId,
      sender_id: connectionState.userId,
      content: text,
    })

    // 回應請求
    res.json({ status: 'success', data: message })
  } catch (error) {
    // 處理錯誤
    res.json({ status: 'error', message: error.message })
  }
})

router.post('/getmessages', async (req, res) => {
  try {
    // 從請求體中獲取聊天室 ID
    const { roomId } = req.body

    // 驗證 room_id
    if (!roomId) {
      return res
        .status(400)
        .json({ status: 'error', message: 'room_id is required' })
    }
    const room_id = roomId

    // 獲取聊天室中的所有訊息，並按照時間順序排序
    const roomMessages = await Message.findAll({
      where: { room_id },
      order: [['created_at', 'ASC']],
    })

    // 如果沒有找到訊息，回傳一個特定的響應
    if (roomMessages.length === 0) {
      return res.json({
        status: 'success',
        message: 'No messages found',
        data: [],
      })
    }

    res.json({ status: 'success', data: roomMessages })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
})

export default router
