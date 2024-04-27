import express from 'express'
import db from '../utils/mysql2-connect.js'
const router = express.Router()

router.get('/', async (req, res) => {
  try {
    // 產品上架1
    const product1sql = `SELECT COUNT(*) A FROM products WHERE status = 1 AND seller_id=2;`
    // 產品未上架2
    const product2sql = `SELECT COUNT(*) B FROM products WHERE status = 2  AND seller_id=2;`
    // 訂單進行中1
    const order1sql = `SELECT COUNT(*) C FROM orders WHERE payment_status = 1  AND seller_id=2;`
    // 訂單已完成2
    const order2sql = `SELECT COUNT(*) D FROM orders WHERE payment_status = 2  AND seller_id=2;`
    // 優惠卷使用中1
    const couponsql = `SELECT COUNT(*) E FROM coupon WHERE coupon_status = 1;`

    let totalCount = [[{}]]
    const sqlTotal = `SELECT COUNT(*) as totalCount FROM products`
    ;[[{ totalCount }]] = await db.query(sqlTotal)
    const [product_yes] = await db.query(product1sql)
    const [prodduct_no] = await db.query(product2sql)
    const [order_no] = await db.query(order1sql)
    const [order_yes] = await db.query(order2sql)
    const [coupon] = await db.query(couponsql)

    const list = {
      product_yes: product_yes,
      prodduct_no: prodduct_no,
      order_no: order_no,
      order_yes: order_yes,
      coupon: coupon,
    }
    console.log(list, 'list')
    res.json({ list })
  } catch (err) {
    console.log('eihqjfoiqehf')
  }
})
export default router
