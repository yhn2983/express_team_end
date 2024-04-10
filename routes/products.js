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
    \`product_name\` LIKE ${db.escape(`%${keyword}%`)} 
    )
    ` // escape本身就會加''單引號, 不需要再額外加上
  }

  // category search
  let searchMain = req.query.searchMain || ''
  let searchSub = req.query.searchSub || ''
  if (searchMain) {
    where += ` AND (
      \`main\`.\`category_name\` = ${db.escape(searchMain)}
      OR
      \`sub\`.\`category_name\` =${db.escape(searchMain)}
    )`
  }
  if (searchSub) {
    where += ` AND (
      \`sub\`.\`category_name\` = ${db.escape(searchSub)}
    )`
  }

  // price search
  let searchPriceA = req.query.searchPriceA || ''
  let searchPriceB = req.query.searchPriceB || ''
  let searchPriceC = req.query.searchPriceC || ''
  let searchPriceD = req.query.searchPriceD || ''
  let searchPriceE = req.query.searchPriceE || ''
  let searchPrice = req.query.searchPrice || ''
  let priceStart = req.query.priceStart || ''
  let priceEnd = req.query.priceEnd || ''
  if (searchPriceA) {
    where += ` AND (
      \`product_price\` >= 0
      AND
      \`product_price\` <= 500
    )`
  }
  if (searchPriceB) {
    where += ` AND (
      \`product_price\` >= 501
      AND
      \`product_price\` <= 1000
    )`
  }
  if (searchPriceC) {
    where += ` AND (
      \`product_price\` >= 1001
      AND
      \`product_price\` <= 3000
    )`
  }
  if (searchPriceD) {
    where += ` AND (
      \`product_price\` >= 3001
      AND
      \`product_price\` <= 5000
    )`
  }
  if (searchPriceE) {
    where += ` AND (
      \`product_price\` >= 5001
    )`
  }
  if (searchPrice) {
    const newpPriceStart = parseInt(priceStart)
    const newPriceEnd = parseInt(priceEnd)
    if (newpPriceStart) {
      where += ` AND (
        \`product_price\` >= ${db.escape(newpPriceStart)}
      )`
    }
    if (newPriceEnd) {
      where += ` AND (
        \`product_price\` < ${db.escape(newPriceEnd)}
      )`
    }
  }

  // product status search
  let searchProdStatusA = req.query.searchProdStatusA || ''
  let searchProdStatusB = req.query.searchProdStatusB || ''
  if (searchProdStatusA) {
    where += ` AND (
      \`product_status\` = 1
    )`
  }
  if (searchProdStatusB) {
    where += ` AND (
      \`product_status\` = 2
    )`
  }

  // upload time search
  let searchDateA = req.query.searchDateA || ''
  let searchDateB = req.query.searchDateB || ''
  let searchDateC = req.query.searchDateC || ''
  let searchDateD = req.query.searchDateD || ''
  let searchDateE = req.query.searchDateE || ''
  let searchDateF = req.query.searchDateF || ''
  let searchDate = req.query.searchDate || ''
  let searchDateStart = req.query.searchDateStart || ''
  let searchDateEnd = req.query.searchDateEnd || ''
  if (searchDateA) {
    where += ` AND (
      \`p\`.\`created_at\` >= '${dayjs('2010-01-01').format('YYYY-MM-DD')}'
      AND
      \`p\`.\`created_at\` <= '${dayjs('2012-12-31').format('YYYY-MM-DD')}'
    )`
  }
  if (searchDateB) {
    where += ` AND (
      \`p\`.\`created_at\` >= '${dayjs('2013-01-01').format('YYYY-MM-DD')}'
      AND
      \`p\`.\`created_at\` <= '${dayjs('2015-12-31').format('YYYY-MM-DD')}'
    )`
  }
  if (searchDateC) {
    where += ` AND (
      \`p\`.\`created_at\` >= '${dayjs('2016-01-01').format('YYYY-MM-DD')}'
      AND
      \`p\`.\`created_at\` <= '${dayjs('2018-12-31').format('YYYY-MM-DD')}'
    )`
  }
  if (searchDateD) {
    where += ` AND (
      \`p\`.\`created_at\` >= '${dayjs('2019-01-01').format('YYYY-MM-DD')}'
      AND
      \`p\`.\`created_at\` <= '${dayjs('2021-12-31').format('YYYY-MM-DD')}'
    )`
  }
  if (searchDateE) {
    where += ` AND (
      \`p\`.\`created_at\` >= '${dayjs('2022-01-01').format('YYYY-MM-DD')}'
      AND
      \`p\`.\`created_at\` <= '${dayjs('2023-01-01').format('YYYY-MM-DD')}'
    )`
  }
  if (searchDateF) {
    where += ` AND (
      \`p\`.\`created_at\` >= '${dayjs('2024-01-01').format('YYYY-MM-DD')}'
      AND
      \`p\`.\`created_at\` <= '${dayjs('2024-12-31').format('YYYY-MM-DD')}'
    )`
  }
  if (searchDate) {
    if (searchDateStart) {
      where += ` AND (
      \`p\`.\`created_at\` >= '${dayjs(searchDateStart).format('YYYY-MM-DD')}'
    )`
    }
    if (searchDateEnd) {
      where += ` AND (
      \`p\`.\`created_at\` <= '${dayjs(searchDateEnd).format('YYYY-MM-DD')}'
    )`
    }
  }

  // 頁數設定
  let redirect = ''
  const perPage = 18
  const sql = `SELECT COUNT(1) AS totalRows FROM categories sub LEFT JOIN categories main ON main.id = sub.parent_id RIGHT JOIN products p ON p.category_id = sub.id JOIN address_book ab ON p.seller_id = ab.id ${where}`
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
    const sql2 = `SELECT sub.category_name s, main.category_name m, main.carbon_points_available mc, sub.carbon_points_available sc, p.*, ab.nickname sellerName, ab.photo sellerPic FROM categories sub LEFT JOIN categories main ON main.id = sub.parent_id RIGHT JOIN products p ON p.category_id = sub.id JOIN address_book ab ON p.seller_id = ab.id ${where} ORDER BY p.id DESC LIMIT ${(page - 1) * perPage}, ${perPage}`
    ;[rows] = await db.query(sql2)
  }

  rows.forEach((item) => {
    item.created_at = dayjs(item.created_at).format('YYYY-MM-DD')
    item.edit_new = dayjs(item.edit_new).format('YYYY-MM-DD')
  })

  let rowsRandom = []
  const sql3 = `SELECT sub.category_name s, main.category_name m, main.carbon_points_available mc, sub.carbon_points_available sc, p.*, ab.nickname sellerName, ab.photo sellerPic FROM categories sub LEFT JOIN categories main ON main.id = sub.parent_id RIGHT JOIN products p ON p.category_id = sub.id JOIN address_book ab ON p.seller_id = ab.id ${where} ORDER BY RAND()`
  ;[rowsRandom] = await db.query(sql3)

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
    rowsRandom,
    page,
    keyword,
    qs: req.query,
    cate,
    searchMain,
    searchSub,
    searchPriceA,
    searchPriceB,
    searchPriceC,
    searchPriceD,
    searchPriceE,
    priceStart,
    priceEnd,
    searchProdStatusA,
    searchProdStatusB,
    searchDateA,
    searchDateB,
    searchDateC,
    searchDateD,
    searchDateE,
    searchDateF,
    searchDateStart,
    searchDateEnd,
  }
}

// router.use((req, res, next) => {
//   let path = req.url.split('?')[0]
//   if (path !== '/') {
//     if (!req.session.admin) {
//       return res.status(403).send('<h1>無權訪問這頁面</h1>')
//     }
//   }
//   next()
// })

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

// 購物車新增路由
// 處理新增資料的表單
router.post('/add', upload.none(), async (req, res) => {
  const output = {
    success: false,
    postData: req.body,
    error: '',
    code: 0,
  }

  const sql =
    'INSERT INTO `cart` (product_photos, product_price, product_qty, total_price, available_cp) VALUES (?, ?, ?, ?, ?)'

  try {
    const [result] = await db.query(sql, [
      req.body.product_photos,
      req.body.product_price,
      req.body.product_qty,
      req.body.total_price,
      req.body.available_cp,
    ])
    output.success = !!result.affectedRows
  } catch (ex) {
    output.error = ex.toString()
  }

  res.json(output)
})

// // 新增路由
// router.get('/add', upload.single('photo'), async (req, res) => {
//   res.locals.pageName = 'prod_add'
//   res.locals.title = '新增商品'

//   const data = await getListData(req)
//   if (data.redirect) {
//     return res.redirect(data.redirect)
//   }
//   res.render('products/add', data)
// })

// router.post('/add', async (req, res) => {
//   const output = {
//     success: false,
//     postData: req.body,
//     error: '',
//     code: 0,
//   }

//   // TODO: 資料格式的檢查
//   const formSchema = z.object({
//     name: z.string().min(2, { message: '名字長度要大於等於2' }),
//     email: z.string().email({ message: '請填寫正確的email' }),
//     mobile: z
//       .string()
//       .regex(/^09\d{2}-?\d{3}-?\d{3}$/, { message: '請填寫正確的手機號碼' }),
//   })
//   const parseResult = formSchema.safeParse(req.body)
//   if (!parseResult.success) {
//     output.issues = parseResult.error.issues
//     return res.json(output)
//   }

//   let birthday = dayjs(req.body.birthday, 'YYYY-MM-DD', true) //dayjs物件
//   birthday = birthday.isValid() ? birthday.format('YYYY-MM-DD') : null
//   req.body.birthday = birthday //置換處理過的值

//   const sql =
//     'INSERT INTO `address_book` (name, email, mobile, birthday, address, created_at) VALUES (?, ?, ?, ?, ?, NOW())'

//   let result
//   try {
//     const [result] = await db.query(sql, [
//       req.body.name,
//       req.body.email,
//       req.body.mobile,
//       req.body.birthday,
//       req.body.address,
//     ])
//     output.success = !!result.affectedRows
//   } catch (ex) {
//     output.error = ex.toString()
//   }

//   res.json(output)
// })
// // 要處理 multipart/form-data
// router.post('/add/multi', upload.none(), async (req, res) => {
//   res.json(req.body)
// })

// router.get('/statistics', async (req, res) => {
//   res.locals.title = '商品管理統計圖表'
//   res.locals.pageName = 'prod_statistics'

//   try {
//     // 計算會員各地區筆數
//     const [rows1] = await db.query(
//       'SELECT COUNT(*) as productsCount FROM products'
//     )
//     res.locals.productsCount = rows1[0].productsCount

//     const [rows2] = await db.query(
//       'SELECT COUNT(*) as man FROM products WHERE main_category = 4'
//     )
//     res.locals.man = rows2[0].man

//     const [rows3] = await db.query(
//       'SELECT COUNT(*) as woman FROM products WHERE main_category = 5'
//     )
//     res.locals.woman = rows3[0].woman

//     const [rows4] = await db.query(
//       'SELECT COUNT(*) as beauty FROM products WHERE main_category = 6'
//     )
//     res.locals.beauty = rows4[0].beauty

//     const [rows5] = await db.query(
//       'SELECT COUNT(*) as home FROM products WHERE main_category = 11'
//     )
//     res.locals.home = rows5[0].home

//     const [rows6] = await db.query(
//       'SELECT COUNT(*) as baby FROM products WHERE main_category = 13'
//     )
//     res.locals.baby = rows6[0].baby

//     const [rows7] = await db.query(
//       'SELECT COUNT(*) as pet FROM products WHERE main_category = 17'
//     )
//     res.locals.pet = rows7[0].pet

//     const [rows8] = await db.query(
//       "SELECT COUNT(*) FROM products AS one WHERE created_at BETWEEN '2022-01-01' AND '2022-06-30'"
//     )
//     res.locals.one = rows8[0].one

//     const [rows9] = await db.query(
//       "SELECT COUNT(*) FROM products AS two WHERE created_at BETWEEN '2022-07-01' AND '2022-12-31'"
//     )
//     res.locals.two = rows9[0].two

//     const [rows10] = await db.query(
//       "SELECT COUNT(*) FROM products AS three WHERE created_at BETWEEN '2023-01-01' AND '2023-06-30'"
//     )
//     res.locals.three = rows10[0].three

//     const [rows11] = await db.query(
//       "SELECT COUNT(*) FROM products AS four WHERE created_at BETWEEN '2023-07-01' AND '2023-12-31'"
//     )
//     res.locals.four = rows11[0].four

//     const [rows12] = await db.query(
//       "SELECT COUNT(*) FROM products AS five WHERE created_at BETWEEN '2024-01-01' AND '2024-06-30'"
//     )
//     res.locals.five = rows12[0].five

//     res.render('products/statistics')
//   } catch (ex) {
//     console.error(ex)
//     res.render('error', {
//       message: '內容似乎出錯了!',
//     })
//   }
// })

export default router
