/* eslint-disable import/no-unresolved */
import express from 'express'
import { OAuth2Client } from 'google-auth-library'
import sequelize from '#configs/db.js'
import 'dotenv/config.js'

const { Member } = sequelize.models
const router = express.Router()

const oAuth2Client = new OAuth2Client(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  'postmessage'
)

router.post('/', async (req, res) => {
  const { tokens } = await oAuth2Client.getToken(req.body.code) // exchange code for tokens
  const { id_token } = tokens
  const ticket = await oAuth2Client.verifyIdToken({
    idToken: id_token,
    audience: process.env.CLIENT_ID,
  })
  const { sub: google_uid, email, name: displayName } = ticket.getPayload()

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

  res.json(returnUser)
})

router.post('/auth/google/refresh-token', async (req, res) => {
  oAuth2Client.setCredentials({
    refresh_token: req.body.refreshToken,
  })
  const newTokens = await oAuth2Client.refreshAccessToken() // optain new tokens
  res.json(newTokens.credentials)
})

export default router
