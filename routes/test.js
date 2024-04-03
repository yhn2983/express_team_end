import express from 'express'
import sequelize from '#configs/db.js'
const { Member } = sequelize.models

const router = express.Router()

router.get('/', async (req, res) => {
  const member = await Member.findOne({
    where: {
      id: 1,
    },
    raw: true, // 只需要資料表中資料
  })

  if (!member) {
    return res.json({ status: 'error', message: '找不到該會員' })
  }

  // 不回傳密碼值
  delete member.password

  return res.json({ status: 'success', data: { member } })
})

export default router
