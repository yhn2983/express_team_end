import express from 'express'
import db from '../utils/mysql2-connect.js'
import upload from '../utils/upload-imgs.js'
import dayjs from 'dayjs'
import { z } from 'zod'
import bodyParser from 'body-parser'
import { v4 as uuidv4 } from 'uuid' // 引入 uuid 模块并解构出 v4 方法，并重命名为 uuidv4
const router = express.Router()

// 使用中间件解析请求体
router.use(bodyParser.json())

// 模拟数据库存储议价请求的数据结构
let bargains = []

// 创建议价请求
router.post('/', async (req, res) => {
  const { product_id, buyer_id, after_bargin_price } = req.body
  const id = uuidv4()
  const sql =
    'INSERT INTO `bargain` (  `buyer_id`, `product_id`, `after_bargin_price` , `seller_id`, `available_cp` , `p_qty`) VALUES (?,?,?,?,?,?)'
  const [result] = await db.query(sql, [
    req.body.buyer_id,
    req.body.product_id,
    req.body.after_bargin_price,
    req.body.seller_id,
    req.body.available_cp,
    req.body.p_qty,
  ])
  // 生成唯一的 ID
  // 使用 uuidv4 生成唯一的 UUID

  // 创建议价请求对象
  const newBargain = {
    id: id,
    buyer_id: buyer_id,
    after_bargin_price: after_bargin_price,
    product_id: product_id,
  }

  bargains.push(newBargain)
  console.log(newBargain)
  console.log(bargains)
  res.json(req.body)
})

router.get('/seller', async (req, res) => {
  const sql = `SELECT *,bargain.id FROM bargain 
  INNER JOIN products 
    ON  products.id= bargain.product_id
    INNER JOIN address_book 
    ON  address_book.id= bargain.buyer_id
  `
  const [rows] = await db.query(sql)

  res.json({ rows })
})
router.get('/buyer', async (req, res) => {
  let whereMain = ' WHERE 1 '
  let memberId = req.query.id || ''
  if (memberId) {
    whereMain += ` AND  bargain.buyer_id=${memberId}`
  }
  const sql = `SELECT *,bargain.id FROM bargain 
  INNER JOIN products 
    ON  products.id= bargain.product_id
    INNER JOIN address_book 
    ON  address_book.id= bargain.seller_id  
    ${whereMain}
  `
  const [rows] = await db.query(sql)

  res.json({ rows })
})
router.delete('/buyer/:id', async (req, res) => {
  const id = +req.params.id || 0
  if (id === 0) {
    return res.json({
      success: false,
      info: '無效的參數',
    })
  }

  const sql = `DELETE FROM bargain WHERE id=?`
  const [result] = await db.query(sql, [id])
  res.json(result)
})

// 获取议价请求详情
router.get('/get/:id', async (req, res) => {
  const id = req.params.id
  const sql = ` SELECT *, bar.id, ab.nickname nickname  FROM  bargain as bar  
    INNER JOIN products as pro
    ON pro.id = bar.product_id JOIN address_book ab ON bar.buyer_id = ab.id
    WHERE bar.id = ${id}
  `
  const [rows] = await db.query(sql)

  res.json({ rows })
})

// 响应议价请求
router.put('/:id/respond', async (req, res) => {
  console.log(req.body)

  const sql = 'UPDATE `bargain` SET `ans_num`= ? WHERE id=?'
  const [rows] = await db.query(sql, [req.body.ans_num, req.body.id])

  const id = req.params.id
  const response = req.body

  console.log({ response })
  // 假设这里会更新数据库中的议价请求状态和相关信息

  res.json(rows)
})

//形成bargain-checkout
router.get('/checkout/:id', async (req, res) => {
  const id = req.params.id
  const sql = `SELECT 
  bargain.id , product_id , pro.product_name , pro.product_price , bargain.after_bargin_price ,pro.seller_id  , bargain.available_cp , bargain.p_qty
  FROM bargain 
  INNER JOIN products AS pro 
  ON pro.id = bargain.product_id
  INNER JOIN address_book AS ab 
  ON ab.id = bargain.buyer_id  
  WHERE bargain.id = ?
  `
  const [rows] = await db.query(sql, [id])

  res.json({ rows })
})

export default router
