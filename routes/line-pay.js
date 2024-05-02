import express from 'express'
import db from './../utils/mysql2-connect.js'
import { createLinePayClient } from 'line-pay-merchant'
import { v4 as uuidv4 } from 'uuid'
import 'dotenv/config.js'
const router = express.Router()

const linePayClient = createLinePayClient({
  channelId: process.env.LINE_PAY_CHANNEL_ID,
  channelSecretKey: process.env.LINE_PAY_CHANNEL_SECRET,
  env: process.env.NODE_ENV,
})

// 在資料庫建立order資料(需要會員登入才能使用)
router.post('/create-order', async (req, res) => {
  const orderId = uuidv4()
  const packageId = uuidv4()

  const order = {
    orderId: orderId,
    currency: 'TWD',
    amount: req.body.amount,
    packages: [
      {
        id: packageId,
        amount: req.body.amount,
        products: req.body.products,
      },
    ],
    options: { display: { locale: 'zh_TW' } },
  }

  const output = {
    success: false,
    postData: req.body,
    error: '',
    code: 0,
  }

  const status = 'pending'

  const sql =
    'INSERT INTO `purchase_order` (id, user_id, amount, status, order_info, created_at, updated_at) VALUES ( ?, ?, ?, ?, ?, NOW(), NOW())'
  const values = [
    orderId,
    req.body.user_id,
    req.body.amount,
    status,
    JSON.stringify(order),
  ]

  try {
    let [result] = await db.query(sql, values)
    output.success = !!result.affectedRows

    console.log(result)
  } catch (ex) {
    output.error = ex.toString()
  }

  const sql2 = 'UPDATE orders SET po=? WHERE id=?'
  const value2 = [orderId, req.body.order_id]

  try {
    let [result] = await db.query(sql2, value2)
    output.success = !!(result.affectedRows && result.changedRows)

    console.log(result)
  } catch (ex) {
    output.error = ex.toString()
  }

  res.json({ status: 'success', data: { order } })
})

// 導向到line-pay，進行交易(純導向不回應前端)
router.get('/reserve', async (req, res) => {
  if (!req.query.orderId) {
    return res.json({ status: 'error', message: 'order id不存在' })
  }

  const orderId = req.query.orderId

  const redirectUrls = {
    confirmUrl: process.env.REACT_REDIRECT_CONFIRM_URL,
    cancelUrl: process.env.REACT_REDIRECT_CANCEL_URL,
  }

  const sql = `SELECT * FROM purchase_order WHERE id=?`
  const orderRecord = await db.query(sql, [orderId])

  console.log(orderRecord)

  const firstObject = orderRecord[0][0]
  const orderInfo = firstObject.order_info
  const order = JSON.parse(orderInfo)

  console.log(`獲得訂單資料，內容如下：`)
  console.log(order)

  try {
    const linePayResponse = await linePayClient.request.send({
      body: { ...order, redirectUrls },
    })

    console.log(linePayResponse)

    const reservation = JSON.parse(JSON.stringify(order))

    reservation.returnCode = linePayResponse.body.returnCode
    reservation.returnMessage = linePayResponse.body.returnMessage
    reservation.transactionId = linePayResponse.body.info.transactionId
    reservation.paymentAccessToken =
      linePayResponse.body.info.paymentAccessToken

    console.log(`預計付款資料(Reservation)已建立。資料如下:`)
    console.log(reservation)

    const output = {
      success: false,
      postData: req.body,
      error: '',
      code: 0,
    }

    const sql2 =
      'UPDATE purchase_order SET reservation=?, transaction_id=? WHERE id=?'
    const values = [
      JSON.stringify(reservation),
      reservation.transactionId,
      orderId,
    ]

    const [result] = await db.query(sql2, values)
    output.success = !!(result.affectedRows && result.changedRows)

    res.redirect(linePayResponse.body.info.paymentUrl.web)
  } catch (e) {
    console.log('error', e)
  }
})

// 向Line Pay確認交易結果
router.get('/confirm', async (req, res) => {
  const transactionId = req.query.transactionId
  console.log(transactionId)

  const sql = `SELECT * FROM purchase_order WHERE transaction_id=?`
  const [rows] = await db.query(sql, [transactionId])
  const dbOrder = rows[0]
  console.log('dbOrder:', dbOrder)

  const amount = dbOrder.amount

  try {
    const linePayResponse = await linePayClient.confirm.send({
      transactionId: transactionId,
      body: {
        currency: 'TWD',
        amount: amount,
      },
    })

    console.log(linePayResponse)

    let status = 'paid'

    if (linePayResponse.body.returnCode !== '0000') {
      status = 'fail'
    }

    const output = {
      success: false,
      postData: req.body,
      error: '',
      code: 0,
    }

    const sql2 =
      'UPDATE purchase_order SET status=?, confirm=?, return_code=? WHERE id=?'
    const values = [
      status,
      JSON.stringify(linePayResponse.body),
      linePayResponse.body.returnCode,
      dbOrder.id,
    ]
    const [result] = await db.query(sql2, values)
    output.success = !!(result.affectedRows && result.changedRows)
    console.log(result)

    const sql3 = 'UPDATE orders SET payment_status=? WHERE po=?'
    const value3 = [2, dbOrder.id]
    const [result2] = await db.query(sql3, value3)
    output.success = !!result2.affectedRows
    console.log(result2)

    return res.json({ status: 'success', data: linePayResponse.body })
  } catch (error) {
    return res.json({ status: 'fail', data: error.data })
  }
})

// 檢查交易用
router.get('/check-transaction', async (req, res) => {
  const transactionId = req.query.transactionId

  try {
    const linePayResponse = await linePayClient.checkPaymentStatus.send({
      transactionId: transactionId,
      params: {},
    })

    res.json(linePayResponse.body)
  } catch (e) {
    res.json({ error: e })
  }
})

export default router
