import express from 'express'
import db from './../utils/mysql2-connect.js'
import upload from './../utils/upload-imgs.js'
import dayjs from 'dayjs'
import { z } from 'zod'

const router = express.Router()

const getListData = async (req) => {
  let keyword = req.query.keyword || ''
  // 模糊搜尋
  let where = ' WHERE 1 '
  if (keyword) {
    where += ` AND ( 
    \`name\` LIKE ${db.escape(`%${keyword}%`)} 
    OR
    \`product_name\` LIKE ${db.escape(`%${keyword}%`)} 
    OR
    \`category_name\` LIKE ${db.escape(`%${keyword}%`)} 
    OR
    \`sub_category\` LIKE ${db.escape(`%${keyword}%`)}
    OR
    \`status_now\` LIKE ${db.escape(`%${keyword}%`)}
    )
    ` // escape本身就會加''單引號, 不需要再額外加上
  }

  let searchItem = req.query.searchItem || ''
  let searchField = ''
  let search_begin = req.query.search_begin || ''
  let search_end = req.query.search_end || ''
  if (searchItem !== '') {
    switch (searchItem) {
      case 'product_price':
        searchField = '`products`.`product_price`'
        where += ` AND (
          ${searchField} >= ${db.escape(search_begin)} 
          AND 
          ${searchField} <= ${db.escape(search_end)}
        )`
        break
      case 'carbon_points_available':
        searchField = '`products`.`carbon_points_available`'
        where += ` AND (
          ${searchField} >= ${db.escape(search_begin)} 
          AND 
          ${searchField} <= ${db.escape(search_end)}
        )`
        break
      case 'created_at':
        searchField = '`products`.`created_at`'
        where += ` AND (
          ${searchField} >= ${db.escape(search_begin)} 
          AND 
          ${searchField} <= ${db.escape(search_end)}
        )`
        break
      case 'edit_new':
        searchField = '`products`.`edit_new`'
        where += ` AND (
          ${searchField} >= ${db.escape(search_begin)} 
          AND 
          ${searchField} <= ${db.escape(search_end)}
        )`
        break
      default:
        break
    }
  }

  // 頁數設定
  let redirect = ''
  const perPage = 20
  const sql = `SELECT COUNT(1) AS totalRows FROM \`products\` JOIN \`categories\` ON categories.id = products.main_category JOIN address_book ON products.seller_id = address_book.sid ${where} ORDER BY products.id`
  let page = +req.query.page || 1
  if (page < 1) {
    redirect = '?page=1'
    return { success: false, redirect }
  }

  const [[{ totalRows }]] = await db.query(sql)
  const totalPages = Math.ceil(totalRows / perPage)

  let rows = []
  if (totalRows > 0) {
    if (page > totalPages) {
      redirect = `?page=${totalPages}`
      return { success: false, redirect }
    }
    const sql2 = `SELECT products.id AS product_id, sub_category, product_photos, product_name, product_price, product_quantity, product_intro, products.created_at, edit_new, status_now, category_name, parent_id, categories.carbon_points_available, name FROM products JOIN categories ON categories.id = products.main_category JOIN address_book ON products.seller_id = address_book.sid ${where} ORDER BY products.id DESC LIMIT ${
      (page - 1) * perPage
    }, ${perPage}`
    ;[rows] = await db.query(sql2)
  }

  rows.forEach((item) => {
    item.created_at = dayjs(item.created_at).format('YYYY-MM-DD')
    item.edit_new = dayjs(item.edit_new).format('YYYY-MM-DD')
  })

  const cate = []
  const [cateRows] = await db.query('SELECT * FROM categories')
  // 先取得第一層的資料
  for (let item of cateRows) {
    if (+item.parent_id === 0) {
      item.nodes = []
      cate.push(item)
    }
  }
  //第二層的項目放到所屬的第一層底下
  for (let a1 of cate) {
    // 拿資料表的每一個項目
    for (let item of cateRows) {
      if (+a1.id === +item.parent_id) {
        a1.nodes.push(item)
      }
    }
  }

  // 單純回應資料
  return {
    success: true,
    totalRows,
    perPage,
    totalPages,
    rows,
    page,
    keyword,
    qs: req.query,
    searchItem,
    searchField,
    search_begin,
    search_end,
    cate,
  }
}

router.use((req, res, next) => {
  let path = req.url.split('?')[0]
  if (path !== '/') {
    if (!req.session.admin) {
      return res.status(403).send('<h1>無權訪問這頁面</h1>')
    }
  }
  next()
})

router.get('/', async (req, res) => {
  res.locals.pageName = 'prod_list'
  res.locals.title = '產品列表 — ' + res.locals.title

  const data = await getListData(req)
  if (data.redirect) {
    return res.redirect(data.redirect)
  }
  if (req.session.admin) {
    //有登入
    res.render('products/list', data)
  } else {
    //沒有登入
    res.render('products/list-no-admin', data)
  }
})

router.get('/api', async (req, res) => {
  const data = await getListData(req)
  res.json(data)
})

// 刪除路由
router.delete('/:product_id', async (req, res) => {
  const id = +req.params.product_id || 0
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
/*
  {
    "fieldCount": 0, 
    "affectedRows": 1, 
    "insertId": 0, 
    "info": "", 
    "serverStatus": 2, 
    "warningStatus": 0
  }
*/

// 新增路由
router.get('/add', upload.single('photo'), async (req, res) => {
  res.locals.pageName = 'prod_add'
  res.locals.title = '新增商品'

  const data = await getListData(req)
  if (data.redirect) {
    return res.redirect(data.redirect)
  }
  res.render('products/add', data)
})

router.post('/add', async (req, res) => {
  const output = {
    success: false,
    postData: req.body,
    error: '',
    code: 0,
  }

  // TODO: 資料格式的檢查
  const formSchema = z.object({
    name: z.string().min(2, { message: '名字長度要大於等於2' }),
    email: z.string().email({ message: '請填寫正確的email' }),
    mobile: z
      .string()
      .regex(/^09\d{2}-?\d{3}-?\d{3}$/, { message: '請填寫正確的手機號碼' }),
  })
  const parseResult = formSchema.safeParse(req.body)
  if (!parseResult.success) {
    output.issues = parseResult.error.issues
    return res.json(output)
  }

  let birthday = dayjs(req.body.birthday, 'YYYY-MM-DD', true) //dayjs物件
  birthday = birthday.isValid() ? birthday.format('YYYY-MM-DD') : null
  req.body.birthday = birthday //置換處理過的值

  const sql =
    'INSERT INTO `address_book` (name, email, mobile, birthday, address, created_at) VALUES (?, ?, ?, ?, ?, NOW())'

  let result
  try {
    [result] = await db.query(sql, [
      req.body.name,
      req.body.email,
      req.body.mobile,
      req.body.birthday,
      req.body.address,
    ])
    output.success = !!result.affectedRows
  } catch (ex) {
    output.error = ex.toString()
  }

  res.json(output)
})
// 要處理 multipart/form-data
router.post('/add/multi', upload.none(), async (req, res) => {
  res.json(req.body)
})

router.get('/statistics', async (req, res) => {
  res.locals.title = '商品管理統計圖表'
  res.locals.pageName = 'prod_statistics'

  try {
    // 計算會員各地區筆數
    const [rows1] = await db.query(
      'SELECT COUNT(*) as productsCount FROM products'
    )
    res.locals.productsCount = rows1[0].productsCount

    const [rows2] = await db.query(
      'SELECT COUNT(*) as man FROM products WHERE main_category = 4'
    )
    res.locals.man = rows2[0].man

    const [rows3] = await db.query(
      'SELECT COUNT(*) as woman FROM products WHERE main_category = 5'
    )
    res.locals.woman = rows3[0].woman

    const [rows4] = await db.query(
      'SELECT COUNT(*) as beauty FROM products WHERE main_category = 6'
    )
    res.locals.beauty = rows4[0].beauty

    const [rows5] = await db.query(
      'SELECT COUNT(*) as home FROM products WHERE main_category = 11'
    )
    res.locals.home = rows5[0].home

    const [rows6] = await db.query(
      'SELECT COUNT(*) as baby FROM products WHERE main_category = 13'
    )
    res.locals.baby = rows6[0].baby

    const [rows7] = await db.query(
      'SELECT COUNT(*) as pet FROM products WHERE main_category = 17'
    )
    res.locals.pet = rows7[0].pet

    const [rows8] = await db.query(
      "SELECT COUNT(*) FROM products AS one WHERE created_at BETWEEN '2022-01-01' AND '2022-06-30'"
    )
    res.locals.one = rows8[0].one

    const [rows9] = await db.query(
      "SELECT COUNT(*) FROM products AS two WHERE created_at BETWEEN '2022-07-01' AND '2022-12-31'"
    )
    res.locals.two = rows9[0].two

    const [rows10] = await db.query(
      "SELECT COUNT(*) FROM products AS three WHERE created_at BETWEEN '2023-01-01' AND '2023-06-30'"
    )
    res.locals.three = rows10[0].three

    const [rows11] = await db.query(
      "SELECT COUNT(*) FROM products AS four WHERE created_at BETWEEN '2023-07-01' AND '2023-12-31'"
    )
    res.locals.four = rows11[0].four

    const [rows12] = await db.query(
      "SELECT COUNT(*) FROM products AS five WHERE created_at BETWEEN '2024-01-01' AND '2024-06-30'"
    )
    res.locals.five = rows12[0].five

    res.render('products/statistics')
  } catch (ex) {
    output.error = ex.toString()
  }
})

export default router
