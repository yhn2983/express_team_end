import express from 'express'
const router = express.Router()

import jsonwebtoken from 'jsonwebtoken'
// 中介軟體，存取隱私會員資料用
import authenticate from '#middlewares/authenticate.js'

// import { generateHash } from '#db-helpers/password-hash.js'

// 存取`.env`設定檔案使用
import 'dotenv/config.js'

// 資料庫使用
// import { QueryTypes } from 'sequelize'
import sequelize from '#configs/db.js'
const { Member } = sequelize.models

// 驗証加密密碼字串用
import { compareHash } from '#db-helpers/password-hash.js'

// 定義安全的私鑰字串
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET

// 已完成
// 檢查登入狀態用
router.get('/check', authenticate, async (req, res) => {
  // 查詢資料庫目前的資料
  const user = await Member.findByPk(req.user.id, {
    raw: true, // 只需要資料表中資料
  })

  if (user) {
    delete user.password
    return res.json({ status: 'success', data: { user } })
  } else {
    return res.json({ status: 'error', message: '使用者不存在' })
  }
})

// 已完成
router.post('/login', async (req, res) => {
  // 從前端來的資料 req.body = { email:'xxxx', password :'xxxx'}
  const loginUser = req.body

  // 檢查從前端來的資料哪些為必要
  if (!loginUser.email || !loginUser.password) {
    return res.json({ status: 'fail', data: null })
  }

  // 查詢資料庫，是否有這帳號與密碼的使用者資料
  // 方式一: 使用直接查詢
  // const user = await sequelize.query(
  //   'SELECT * FROM user WHERE nickname=? LIMIT 1',
  //   {
  //     replacements: [loginUser.nickname], //代入問號值
  //     type: QueryTypes.SELECT, //執行為SELECT
  //     plain: true, // 只回傳第一筆資料
  //     raw: true, // 只需要資料表中資料
  //     logging: console.log, // SQL執行呈現在console.log
  //   }
  // )

  // 方式二: 使用模型查詢
  const user = await Member.findOne({
    where: {
      email: loginUser.email,
    },
    raw: true, // 只需要資料表中資料
  })

  // console.log(user)

  // user=null代表不存在
  if (!user) {
    return res.json({ status: 'error', message: '使用者不存在' })
  }

  // compareHash(登入時的密碼純字串, 資料庫中的密碼hash) 比較密碼正確性
  // isValid=true 代表正確
  const isValid = await compareHash(loginUser.password, user.password)

  // isValid=false 代表密碼錯誤
  if (!isValid) {
    return res.json({ status: 'error', message: '密碼錯誤' })
  }

  // 存取令牌(access token)只需要id和username就足夠，其它資料可以再向資料庫查詢
  const returnUser = {
    id: user.id,
    email: user.email,
    nickname: user.nickname,
    // google_uid: user.google_uid,
    // line_uid: user.line_uid,
  }

  // 產生存取令牌(access token)，其中包含會員資料
  const accessToken = jsonwebtoken.sign(returnUser, accessTokenSecret, {
    expiresIn: '3d',
  })

  // 使用httpOnly cookie來讓瀏覽器端儲存access token
  res.cookie('accessToken', accessToken, { httpOnly: true })

  /* localStorage
  // 將 access token 放在 Authorization 標頭中
  res.set('Authorization', `Bearer ${accessToken}`)
  */

  // 傳送access token回應(例如react可以儲存在state中使用)
  res.json({
    status: 'success',
    data: { accessToken },
  })
})

// 已完成
router.post('/logout', authenticate, (req, res) => {
  // 清除cookie
  res.clearCookie('accessToken', { httpOnly: true })
  res.json({ status: 'success', data: null })
})

// 已完成
router.post('/register', async (req, res) => {
  // 從前端來的資料 req.body = { email:'xxxx', password :'xxxx', name: 'xxxx', nickname: 'xxxx', mobile: 'xxxx', birthday: 'xxxx', address: 'xxxx'}
  const registerUser = req.body

  // // 如果電話號碼的第一個字元是 "0"，則去掉它
  // if (registerUser.mobile.startsWith('0')) {
  //   registerUser.mobile = registerUser.mobile.substring(1)
  // }

  // 查詢資料庫，是否已存在相同的email
  // where指的的是不可以有相同的email
  // defaults就新增資料
  const [user, created] = await Member.findOrCreate({
    where: {
      email: registerUser.email,
    },
    defaults: {
      email: registerUser.email,
      password: registerUser.password,
      name: registerUser.name,
      nickname: registerUser.nickname,
      mobile: registerUser.mobile,
      birthday: registerUser.birthday,
      address: registerUser.address,
      photo: 'default.png', // 預設的photo
      member_level: 1,
      level_name: 'level 0',
      level_desc: '等待任務中',
      carbon_points_got: 0,
      carbon_points_have: 0,
      google_uid: null, // 將 google_uid 設定為 NULL
    },
  })

  // 新增失敗 created=false 代表沒有新增成功
  if (!created) {
    return res.json({ status: 'error', message: '建立會員失敗' })
  }

  // // 將密碼進行hash處理
  // const hashedPassword = await generateHash(registerUser.password)

  // 將email和hash後的密碼以及其他資訊，還有設定為0的欄位和預設的photo存入資料庫

  /* 寫在findOrCreate裡面，不需要再寫
    await Member.create({
    email: registerUser.email,
    password: registerUser.password,
    name: registerUser.name,
    nickname: registerUser.nickname,
    mobile: registerUser.mobile,
    birthday: registerUser.birthday,
    address: registerUser.address,
    photo: 'default_photo.jpg', // 預設的photo
    member_level: 0,
    level_name: '0',
    level_desc: '0',
    carbon_points_got: 0,
    carbon_points_have: 0,
  })
  */

  // 成功建立會員的回應
  // 狀態201是建立資料表的標準回應
  // 如果有必要可以加上location會員建立的url回應在header
  // res.location(`/api/user/${user.id}`)
  return res.status(201).json({ status: 'success', data: null })
})

export default router
