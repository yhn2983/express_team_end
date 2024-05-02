import express from 'express'
import db from '../utils/mysql2-connect.js'
import dayjs from 'dayjs'

const router = express.Router()
router.get('/api', async (req, res) => {
  const data = await getListData(req, res)
  res.json(data)
})

router.delete('/api/:id', async (req, res) => {
  const id = +req.params.id || 0
  if (id === 0) {
    return res.json({
      success: false,
      info: '無效的參數',
    })
  }
  const sql = `DELETE FROM products WHERE id=?`
  const [result] = await db.query(sql, [id])
  res.json(result)
})

// 修改資料的表單
router.get('/edit/:id', async (req, res) => {
  const id = +req.params.id || 0
  if (!id) {
    return res.redirect('/products')
  }
  const sql = `SELECT * FROM products WHERE id=${id}`
  const [rows] = await db.query(sql)
  if (!rows.length) {
    return res.redirect('/products')
  }
  const r = rows[0]
  const createdDate = dayjs(r.created_at)
  const editedDate = dayjs(r.edit_at)

  r.created_at = createdDate.isValid() ? createdDate.format('YYYY-MM-DD') : ''
  r.edit_at = editedDate.isValid() ? editedDate.format('YYYY-MM-DD') : ''

  res.render('products/edit', r)
})

router.put('/edit/:id', async (req, res) => {
  const output = {
    success: false,
    postData: req.body,
    error: '',
    code: 0,
  }

  let id = +req.params.id || 0

  let createdDate = dayjs(req.body.created_at, 'YYYY-MM-DD', true) // dayjs 物件
  let editedDate = dayjs(req.body.edit_at, 'YYYY-MM-DD', true) // dayjs 物件
  // 置換處理過的值
  req.body.created_at = createdDate.isValid()
    ? createdDate.format('YYYY-MM-DD')
    : null
  req.body.edit_at = editedDate.isValid()
    ? editedDate.format('YYYY-MM-DD')
    : null

  // TODO: 資料格式檢查

  const sql = 'UPDATE `products` SET ? WHERE id=?'
  try {
    // 執行 SQL 時最好做錯誤處理
    const [result] = await db.query(sql, [req.body, id])
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

const getListData = async (req, res) => {
  // SELECT * FROM `address_book` WHERE `name` LIKE '%詩涵%'
  let keyword = req.query.keyword || ''
  let minValue = req.query.minValue || null
  let maxValue = req.query.maxValue || null
  let created_at = req.query.created_at || null
  console.log('req.query', req.query)

  if (created_at) {
    // 日期的格式檢查
    created_at = dayjs(created_at, 'YYYY-MM-DD', true) // dayjs 物件
    // 如果是合法的日期格式, 就轉換為日期的字串, 否則設定為空值
    created_at = created_at.isValid() ? created_at.format('YYYY-MM-DD') : null
  }
  let created_at2 = req.query.created_at2 || null
  if (created_at2) {
    created_at2 = dayjs(created_at2, 'YYYY-MM-DD', true) // dayjs 物件
    // 如果是合法的日期格式, 就轉換為日期的字串, 否則設定為空值
    created_at2 = created_at2.isValid()
      ? created_at2.format('YYYY-MM-DD')
      : null
  }

  let where = ' WHERE 1 '
  if (keyword) {
    // 避免 SQL injection
    where += ` AND (
    \`product_name\` LIKE ${db.escape(`%${keyword}%`)} 
    )
    `
  }
  if (created_at && created_at2) {
    // 將 created_at條件合併為一個條件，同時篩選這兩個欄位
    where += ` AND (\`p\`.\`created_at\` >= ${db.escape(created_at)} AND \`p\`.\`created_at\` <= ${db.escape(created_at2)}) `
  } else if (created_at) {
    // 只篩選 created_at 欄位
    where += ` AND \`p\`.\`created_at\` >= ${db.escape(created_at)} `
  } else if (created_at2) {
    // 只篩選 created_at2 欄位
    where += ` AND \`p\`.\`created_at\` <= ${db.escape(created_at2)} `
  }

  if (minValue) {
    // 这里你可以添加对输入值的格式检查，确保它们符合你的要求
    where += ` AND product_qty >= ${db.escape(minValue)} `
  }

  if (maxValue) {
    // 这里你可以添加对输入值的格式检查，确保它们符合你的要求
    where += ` AND ( product_qty <= ${db.escape(maxValue)} ) `
  }

  let redirect = '' // 作為轉換依據的變數
  const perPage = 20 // 每頁最多幾筆
  const sql = `SELECT COUNT(1) totalRows FROM products`
  let page = +req.query.page || 1
  if (page < 1) {
    redirect = '?page=1'
    return { success: false, redirect }
  }

  // 多層的展開, totalRows 總筆數
  const [[{ totalRows }]] = await db.query(sql)
  const totalPages = Math.ceil(totalRows / perPage) // 總頁數

  let rows = []
  if (totalRows > 0) {
    if (page > totalPages) {
      redirect = `?page=${totalPages}`
      return { success: false, redirect }
    }
    const sql2 = `SELECT sub.category_name s, main.category_name m, main.carbon_points_available mc, sub.carbon_points_available sc, p.*, ab.nickname sellerName, ab.photo sellerPic FROM categories sub LEFT JOIN categories main ON main.id = sub.parent_id RIGHT JOIN products p ON p.category_id = sub.id JOIN address_book ab ON p.seller_id = ab.id ${where} AND p.seller_id=2 ORDER BY p.id DESC LIMIT ${(page - 1) * perPage}, ${perPage}`

    ;[rows] = await db.query(sql2)
    console.log(sql2)
  }
  rows.forEach((item) => {
    // 把 birthday 欄位的值轉換成 "YYYY-MM-DD" 格式的字串
    const d = dayjs(item.created_at)
    item.created_at = d.isValid() ? d.format('YYYY-MM-DD') : ''
  })

  rows.forEach((item) => {
    // 把 birthday 欄位的值轉換成 "YYYY-MM-DD" 格式的字串
    const d = dayjs(item.edit_at)
    item.edit_at = d.isValid() ? d.format('YYYY-MM-DD') : ''
  })

  return {
    success: true,
    totalRows,
    perPage,
    totalPages,
    rows,
    page,
    keyword,
    qs: req.query,
  }
}

export default router
