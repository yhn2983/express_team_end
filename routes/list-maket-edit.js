import express from 'express'
import db from './../utils/mysql2-connect.js'
import upload from './../utils/upload-imgs.js'
import dayjs from 'dayjs'

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

  let barterProds = []
  const sql4 = `SELECT sub.category_name s, main.category_name m, main.carbon_points_available mc, sub.carbon_points_available sc, p.*, ab.nickname sellerName, ab.photo sellerPic FROM categories sub LEFT JOIN categories main ON main.id = sub.parent_id RIGHT JOIN products p ON p.category_id = sub.id JOIN address_book ab ON p.seller_id = ab.id where p.seller_id = 1019`
  ;[barterProds] = await db.query(sql4)

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
    // searchProdStatusA,
    // searchProdStatusB,

    barterProds,
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

// router.get('/', async (req, res) => {
//   res.locals.pageName = 'prod_list'
//   res.locals.title = '產品列表 — ' + res.locals.title

//   const data = await getListData(req)
//   if (data.redirect) {
//     return res.redirect(data.redirect)
//   }
//   if (req.session.admin) {
//     //有登入
//     res.render('products/list', data)
//   } else {
//     //沒有登入
//     res.render('products/list-no-admin', data)
//   }
// })

router.get('/api', async (req, res) => {
  const data = await getListData(req)
  res.json(data)
})

router.get('/api/:pid', async (req, res) => {
  const pid = +req.params.pid || 0
  if (!pid) {
    return res.json({ success: false })
  }
  const sql = `SELECT sub.category_name s, main.category_name m, main.carbon_points_available mc, main.id as m_id  , sub.parent_id , sub.carbon_points_available sc, p.*, ab.nickname sellerName, ab.photo sellerPic FROM categories sub LEFT JOIN categories main  ON main.id = sub.parent_id RIGHT JOIN products p ON p.category_id = sub.id JOIN address_book ab ON p.seller_id = ab.id WHERE p.id=${pid}`
  const [rows] = await db.query(sql)
  if (!rows.length) {
    return res.json({ success: false })
  }
  const r = rows[0]
  const d_c = dayjs(r.created_at)
  const d_e = dayjs(r.edit_at)
  r.created_at = d_c.isValid() ? d_c.format('YYYY-MM-DD') : ''
  r.edit_at = d_e.isValid() ? d_e.format('YYYY-MM-DD') : ''

  res.json({ success: true, data: r })
})

router.put('/edit/:pid', upload.single('avatar'), async (req, res) => {
  const output = {
    success: false,
    postData: req.body,
    error: '',
    code: 0,
  }
  let pid = +req.params.pid || 0
  const sql2 = `UPDATE \`products\` SET ?  where id=${pid} `
  console.log(sql2)
  req.body.created_at = new Date() // 新增屬性 created_at (欄位名稱)

  console.log(req.file, req.body)

  let result
  try {
    const [result] = await db.query(sql2, [req.body, pid])

    output.success = !!result.affectedRows
  } catch (ex) {
    output.error = ex.toString()
  }

  res.json(output)
})

export default router
