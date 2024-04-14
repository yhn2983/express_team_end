import express from 'express'
const router = express.Router()
import authenticate from '#middlewares/authenticate.js'
import sequelize from '#configs/db.js'

router.post('/', (req, res) => {
  const io = req.app.io
  // 你可以在這裡使用 `io` 來發送事件或訊息
  res.json({ message: 'Chat route' })
})

export default router
