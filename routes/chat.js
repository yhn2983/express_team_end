import express from 'express'
const router = express.Router()
import authenticate from '#middlewares/authenticate.js'
import sequelize from '#configs/db.js'
import { Op } from 'sequelize'
// 存取`.env`設定檔案使用
import 'dotenv/config.js'
const { Room } = sequelize.models

router.post('/', (req, res) => {
  const io = req.app.io
  // 你可以在這裡使用 `io` 來發送事件或訊息
  res.json({ message: 'Chat route' })
})

router.post('/rooms', async (req, res) => {
  const { user1_id, user2_id } = req.body

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

export default router
