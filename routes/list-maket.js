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

  //商品計數
  //  商品總數
  let totalCount = [[{}]]
  const sqlTotal = `SELECT COUNT(*) as totalCount FROM products`
  ;[[{ totalCount }]] = await db.query(sqlTotal)
  //  商品價格區間計數
  let priceRangeA = [[{}]]
  const sqlPriceRangeA = `SELECT COUNT(*) AS priceRangeA FROM products WHERE product_price BETWEEN 0 AND 500`
  ;[[{ priceRangeA }]] = await db.query(sqlPriceRangeA)
  let priceRangeB = [[{}]]
  const sqlPriceRangeB = `SELECT COUNT(*) AS priceRangeB FROM products WHERE product_price BETWEEN 501 AND 1000`
  ;[[{ priceRangeB }]] = await db.query(sqlPriceRangeB)
  let priceRangeC = [[{}]]
  const sqlPriceRangeC = `SELECT COUNT(*) AS priceRangeC FROM products WHERE product_price BETWEEN 1001 AND 3000`
  ;[[{ priceRangeC }]] = await db.query(sqlPriceRangeC)
  let priceRangeD = [[{}]]
  const sqlPriceRangeD = `SELECT COUNT(*) AS priceRangeD FROM products WHERE product_price BETWEEN 3001 AND 5000`
  ;[[{ priceRangeD }]] = await db.query(sqlPriceRangeD)
  let priceRangeE = [[{}]]
  const sqlPriceRangeE = `SELECT COUNT(*) AS priceRangeE FROM products WHERE product_price > 5001`
  ;[[{ priceRangeE }]] = await db.query(sqlPriceRangeE)
  //  商品狀態計數
  let prodStatusA = [[{}]]
  const sqlProdStatusA = `SELECT COUNT(*) AS prodStatusA FROM products WHERE product_status = 1`
  ;[[{ prodStatusA }]] = await db.query(sqlProdStatusA)
  let prodStatusB = [[{}]]
  const sqlProdStatusB = `SELECT COUNT(*) AS prodStatusB FROM products WHERE product_status = 2`
  ;[[{ prodStatusB }]] = await db.query(sqlProdStatusB)
  //  上架時間計數
  let dateRangeA = [[{}]]
  const sqlDateRangeA = `SELECT COUNT(*) AS dateRangeA FROM products WHERE created_at BETWEEN '2010-01-01' AND '2012-12-31'`
  ;[[{ dateRangeA }]] = await db.query(sqlDateRangeA)
  let dateRangeB = [[{}]]
  const sqlDateRangeB = `SELECT COUNT(*) AS dateRangeB FROM products WHERE created_at BETWEEN '2013-01-01' AND '2015-12-31'`
  ;[[{ dateRangeB }]] = await db.query(sqlDateRangeB)
  let dateRangeC = [[{}]]
  const sqlDateRangeC = `SELECT COUNT(*) AS dateRangeC FROM products WHERE created_at BETWEEN '2016-01-01' AND '2018-12-31'`
  ;[[{ dateRangeC }]] = await db.query(sqlDateRangeC)
  let dateRangeD = [[{}]]
  const sqlDateRangeD = `SELECT COUNT(*) AS dateRangeD FROM products WHERE created_at BETWEEN '2019-01-01' AND '2021-12-31'`
  ;[[{ dateRangeD }]] = await db.query(sqlDateRangeD)
  let dateRangeE = [[{}]]
  const sqlDateRangeE = `SELECT COUNT(*) AS dateRangeE FROM products WHERE created_at BETWEEN '2022-01-01' AND '2023-12-31'`
  ;[[{ dateRangeE }]] = await db.query(sqlDateRangeE)
  let dateRangeF = [[{}]]
  const sqlDateRangeF = `SELECT COUNT(*) AS dateRangeF FROM products WHERE created_at BETWEEN '2024-01-01' AND '2024-12-31'`
  ;[[{ dateRangeF }]] = await db.query(sqlDateRangeF)

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
    totalCount,
    priceRangeA,
    priceRangeB,
    priceRangeC,
    priceRangeD,
    priceRangeE,
    prodStatusA,
    prodStatusB,
    dateRangeA,
    dateRangeB,
    dateRangeC,
    dateRangeD,
    dateRangeE,
    dateRangeF,
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

router.get('/api/:pid', async (req, res) => {
  const pid = +req.params.pid || 0
  if (!pid) {
    return res.json({ success: false })
  }
  const sql = `SELECT sub.category_name s, main.category_name m, main.carbon_points_available mc, sub.carbon_points_available sc, p.*, ab.nickname sellerName, ab.photo sellerPic FROM categories sub LEFT JOIN categories main ON main.id = sub.parent_id RIGHT JOIN products p ON p.category_id = sub.id JOIN address_book ab ON p.seller_id = ab.id WHERE p.id=${pid}`
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

export default router
