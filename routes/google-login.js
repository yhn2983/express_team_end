/* eslint-disable import/no-unresolved */
import express from 'express'
import { OAuth2Client } from 'google-auth-library'
import sequelize from '#configs/db.js'
import 'dotenv/config.js'
import jsonwebtoken from 'jsonwebtoken'

// 定義安全的私鑰字串
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET

const { Member } = sequelize.models
const router = express.Router()

const oAuth2Client = new OAuth2Client(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  'postmessage'
)

router.post('/', async (req, res) => {
  const { tokens } = await oAuth2Client.getToken(req.body.code) // exchange code for tokens
  const { id_token, access_token } = tokens
  const ticket = await oAuth2Client.verifyIdToken({
    idToken: id_token,
    audience: process.env.CLIENT_ID,
  })
  const { sub: google_uid, email, name: displayName } = ticket.getPayload()

  console.log('access_token', access_token)

  const total = await Member.count({
    where: {
      google_uid,
    },
  })

  let returnUser = {
    id: 0,
    nickname: '',
    google_uid: '',
  }

  if (total) {
    const dbUser = await Member.findOne({
      where: {
        google_uid,
      },
      raw: true,
    })

    returnUser = {
      id: dbUser.id,
      nickname: dbUser.nickname,
      google_uid: dbUser.google_uid,
    }
  } else {
    const user = {
      name: displayName,
      email: email,
      google_uid,
      member_level: 0,
    }

    const newUser = await Member.create(user)

    returnUser = {
      id: newUser.id,
      nickname: '',
      google_uid: newUser.google_uid,
    }
  }

  // 產生存取令牌(access token)，其中包含會員資料
  const accessToken = jsonwebtoken.sign(returnUser, accessTokenSecret, {
    expiresIn: '3d',
  })

  // 將 access token 存儲在 httpOnly cookie 中
  // 將 access token 存儲在 httpOnly cookie 中
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    sameSite: 'None',
    secure: true,
  })

  // 傳送access token回應(react可以儲存在state中使用)
  // 延遲 1 秒後再結束 response
  setTimeout(() => {
    return res.json({
      status: 'success',
      data: {
        accessToken,
      },
    })
  }, 1000)
})

router.post('/auth/google/refresh-token', async (req, res) => {
  oAuth2Client.setCredentials({
    refresh_token: req.body.refreshToken,
  })
  const newTokens = await oAuth2Client.refreshAccessToken() // optain new tokens
  res.json(newTokens.credentials)
})

export default router
