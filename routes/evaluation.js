import express from 'express'
import db from '../utils/mysql2-connect.js'
import upload from '../utils/upload-imgs.js'
import dayjs from 'dayjs'
import { z } from 'zod'

/*
我的最愛的資料庫
SELECT ab.* , pl.sid like_sid FROM `address_book` ab

LEFT JOIN 
(SELECT * FROM `product_likes` WHERE member_sid=?)
product_likes pl ON ab.sid=pl.product_sid

ORDER BY ab.sid DESC   LIMIT 0,25
*/

const router = express.Router()

// 修改資料的表單
router.get('/get/:eid', async (req, res) => {
  const eid = +req.params.eid || 0
  if (!eid) {
    return res.json({ success: false })
  }
  try {
    const sql = `SELECT   products.product_name , 
  products.product_photos , 
  seller_ab.name AS seller_name 
   FROM orders 
 INNER JOIN orders_items 
 ON orders_items.order_id =orders.id 
 INNER JOIN address_book as seller_ab
 ON orders.seller_id = seller_ab.id 
 INNER JOIN products 
 ON orders_items.product_id =products.id 
 WHERE orders.id=?`
    const [rows] = await db.query(sql, [eid])
    if (!rows.length) {
      return res.json({ success: false })
    }
    const r = rows[0]
    console.log(r)
    res.json(r)
  } catch (error) {
    console.error('Error fetching data from database:', error)
    res.status(500).json({ success: false, error: 'Internal Server Error' })
  }
})

router.put('/edit/:eid', async (req, res) => {
  const output = {
    success: false,
    postData: req.body,
    error: '',
    code: 0,
  }

  let id = +req.params.id || 0

  // TODO: 資料格式檢查

  const sql =
    'UPDATE `orders_items` SET rating=?, comments=?, evaluation_date = NOW() WHERE id=?'
  try {
    // 執行 SQL 時最好做錯誤處理
    const [result] = await db.query(sql, [
      req.body.rating, // 更新评分
      req.body.comments,
      // req.body.comments, // 更新评论
      req.body.id, // 更新条件为 id
    ])

    console.log('test', req.body)
    /*
    {
      "fieldCount": 0,
      "affectedRows": 1,
      "insertId": 0,
      "info": "Rows matched: 1  Changed: 1  Warnings: 0",
      "serverStatus": 2,
      "warningStatus": 0,
      "changedRows": 1
    }
    */
    output.success = !!(result.affectedRows && result.changedRows)
  } catch (ex) {
    output.error = ex.toString()
  }
  res.json(output)
})

export default router
