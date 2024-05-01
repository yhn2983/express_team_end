import express from 'express'
import db from '../utils/mysql2-connect.js'
import dayjs from 'dayjs'

const router = express.Router()

let cateRows // 在較高的範圍內定義 cateRows

router.get('/orders', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM orders')
  const cate = []
  for (let item of rows) {
    if (+item.parent_id === 0) {
      item.nodes = []
      cate.push(item)
    }
  }
  for (let a1 of cate) {
    for (let item of rows) {
      if (+a1.id === +item.parent_id) {
        a1.nodes.push(item)
      }
    }
  }
  res.json({ success: true, data: cate })
})

router.get('/ordersA', async (req, res) => {
  const [rows] = await db.query(
    'SELECT orders.*, address_book.nickname nickname, coupon.coupon_name coupon_name FROM orders JOIN address_book ON orders.buyer_id = address_book.id JOIN coupon ON orders.discount_coupon = coupon.id  WHERE seller_id=2 AND complete_status=1'
  )
  const cate = []
  for (let item of rows) {
    if (+item.complete_status === 1) {
      item.nodes = []
      cate.push(item)
    }
  }

  // for (let a1 of cate) {
  //   for (let item of rows) {
  //     if (+a1.id === +item.complete_status) {
  //       a1.nodes.push(item)
  //     }
  //   }
  // }
  res.json({ success: true, data: cate })
})
router.get('/ordersB', async (req, res) => {
  const [rows] = await db.query(
    'SELECT orders.*, address_book.nickname nickname, coupon.coupon_name coupon_name FROM orders JOIN address_book ON orders.buyer_id = address_book.id JOIN coupon ON orders.discount_coupon = coupon.id  WHERE seller_id=2 AND complete_status=2'
  )
  const cate = []
  for (let item of rows) {
    if (+item.complete_status === 2) {
      item.nodes = []
      cate.push(item)
    }
  }

  // for (let a1 of cate) {
  //   for (let item of rows) {
  //     if (+a1.id === +item.complete_status) {
  //       a1.nodes.push(item)
  //     }
  //   }
  // }
  res.json({ success: true, data: cate })
})
router.get('/ordersData', async (req, res) => {
  const data = await getListData(req, res)
  res.json(data)
})
const getListData = async (req, res) => {
  let keyword = req.query.keyword || ''
  let minValue = req.query.minValue || null
  let maxValue = req.query.maxValue || null
  let order_date = req.query.order_date || null
  if (order_date) {
    // 日期的格式檢查
    order_date = dayjs(order_date, 'YYYY-MM-DD', true) // dayjs 物件
    // 如果是合法的日期格式, 就轉換為日期的字串, 否則設定為空值
    order_date = order_date.isValid() ? order_date.format('YYYY-MM-DD') : null
  }

  let where = ' WHERE 1 '
  if (keyword) {
    // 避免 SQL injection
    where += ` AND (
    \`orders\` LIKE ${db.escape(`%${keyword}%`)} 
    )
    `
  }
  if (minValue) {
    // 这里你可以添加对输入值的格式检查，确保它们符合你的要求
    where += ` AND order_date >= ${db.escape(minValue)} `
  }

  if (maxValue) {
    // 这里你可以添加对输入值的格式检查，确保它们符合你的要求
    where += ` AND ( order_date <= ${db.escape(maxValue)} ) `
  }
  const [rows] = await db.query(`SELECT * FROM orders ${where} `)
  return {
    success: true,
    keyword,
    qs: req.query,
    rows,
  }
}
router.get('/', async (req, res) => {
  const page = Number(req.query.page) || 1 // 获取查询参数中的页码，默认为第1页
  const limit = 10 // 每页显示的数据条数
  const offset = (page - 1) * limit // 计算偏移量
  cateRows = await db.query(`SELECT * FROM orders WHERE seller_id=2`) // h在這裡賦值

  const firstLevelCate = []
  for (let item of cateRows) {
    if (+item.parent_id === 0) {
      item.nodes = []
      firstLevelCate.push(item)
    }
  }

  //第二層的項目放到所屬的第一層底下
  for (let a1 of firstLevelCate) {
    const childCateRows = [...cateRows] // 複製一份 cateRows 陣列
    for (let item of childCateRows) {
      if (+a1.id === +item.parent_id) {
        a1.nodes.push(item)
      }
    }
  }

  try {
    const [rows] = await db.query(
      `SELECT orders.*, address_book.nickname nickname, coupon.coupon_name coupon_name FROM orders JOIN address_book ON orders.buyer_id = address_book.id JOIN coupon ON orders.discount_coupon = coupon.id  WHERE seller_id=2 LIMIT ${offset}, ${limit}`
    )
    // 查询指定页码的数据
    // const [rows] = await db.execute('SELECT * FROM orders LIMIT ?, ?', [
    //   offset,
    //   limit,
    // ])
    // 查询总记录数
    const [[totalCount]] = await db.execute(
      'SELECT COUNT(*) as total FROM orders'
    )
    // 计算总页数
    const totalPages = Math.ceil(totalCount.total / limit)

    res.json({ success: true, data: rows, totalPages })
  } catch (error) {
    console.error('Error fetching data:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

export default router
