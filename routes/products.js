import express from 'express'
import db from './../utils/mysql2-connect.js'
import dayjs from 'dayjs'
import transporter from '#configs/mail.js'
import { z } from 'zod'

const router = express.Router()

router.post('/sendEmail', async (req, res) => {
  const { name, email, subject, message } = req.body

  const mailText = () => `(此封信件為自動寄出，請勿直接回覆)\n
  您好，${name}先生/小姐\n
  您的訊息：${message}\n\n
  請稍待回音，我們將於3-5個工作天內盡快回覆您，謝謝您！
    

  DEAL 2ND SHOP團隊敬上`

  const mailOptions = {
    // 這裡要改寄送人名稱，email在.env檔中代入
    from: `DEAL官方團隊<${process.env.SMTP_TO_EMAIL}>`,
    to: email,
    subject: `自動回復：${subject}`,
    text: mailText(),
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log('郵件發送成功！')
    res.status(200).send('郵件發送成功!')
  } catch (e) {
    res.status(500).send('郵件發送失敗，請稍後再試')
  }
})

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

  // sort
  let orderby = 'ORDER BY '
  let priceOrder = req.query.priceOrder || ''
  let dateOrder = req.query.dateOrder || ''
  if (priceOrder == 'priceSortASC') {
    orderby += `\`product_price\` ASC`
  } else if (priceOrder == 'priceSortDESC') {
    orderby += `\`product_price\` DESC`
  } else if (dateOrder == 'dateSortASC') {
    orderby += `\`p\`.\`created_at\` ASC`
  } else if (dateOrder == 'dateSortDESC') {
    orderby += `\`p\`.\`created_at\` DESC`
  } else {
    orderby += 'RAND()'
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

  if (priceStart) {
    where += ` AND (
        \`product_price\` >= ${db.escape(priceStart)}
      )`
  }
  if (priceEnd) {
    where += ` AND (
        \`product_price\` < ${db.escape(priceEnd)}
      )`
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

  if (searchDateStart) {
    searchDateStart = `${searchDateStart} 00:00:00`
    where += ` AND (\`p\`.\`created_at\` >= '${searchDateStart}'
  )`
  }
  if (searchDateEnd) {
    searchDateEnd = `${searchDateEnd} 23:59:59`
    where += ` AND (\`p\`.\`created_at\` <= '${searchDateEnd}' 
  )`
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
    const sql2 = `SELECT sub.category_name s, main.category_name m, main.carbon_points_available mc, sub.carbon_points_available sc, p.*, ab.nickname sellerName, ab.photo sellerPic FROM categories sub LEFT JOIN categories main ON main.id = sub.parent_id RIGHT JOIN products p ON p.category_id = sub.id JOIN address_book ab ON p.seller_id = ab.id ${where} ${orderby} LIMIT ${(page - 1) * perPage}, ${perPage}`
    ;[rows] = await db.query(sql2)
  }

  rows.forEach((item) => {
    item.created_at = dayjs(item.created_at).format('YYYY-MM-DD')
    item.edit_new = dayjs(item.edit_new).format('YYYY-MM-DD')
  })

  let rowsRandom = []
  const sql3 = `SELECT sub.category_name s, main.category_name m, main.carbon_points_available mc, sub.carbon_points_available sc, p.*, ab.nickname sellerName, ab.photo sellerPic FROM categories sub LEFT JOIN categories main ON main.id = sub.parent_id RIGHT JOIN products p ON p.category_id = sub.id JOIN address_book ab ON p.seller_id = ab.id ${where} ORDER BY RAND()`
  ;[rowsRandom] = await db.query(sql3)

  const mid4 = +req.query.member_id || 0
  let barterProds = []
  const sql4 = `SELECT sub.category_name s, main.category_name m, main.carbon_points_available mc, sub.carbon_points_available sc, p.*, ab.nickname sellerName, ab.photo sellerPic FROM categories sub LEFT JOIN categories main ON main.id = sub.parent_id RIGHT JOIN products p ON p.category_id = sub.id JOIN address_book ab ON p.seller_id = ab.id where p.seller_id=${mid4}`
  ;[barterProds] = await db.query(sql4)

  const mid = +req.query.member_id || 0
  let cartProd = []
  const sql5 = `SELECT * FROM cart WHERE member_id=${mid}`
  ;[cartProd] = await db.query(sql5)

  const mid2 = +req.query.member_id || 0
  let likeProd = []
  const sql6 = `SELECT * FROM products_likes WHERE member_id=${mid2}`
  ;[likeProd] = await db.query(sql6)

  const mid3 = +req.query.member_id || 0
  let barter = []
  const sql7 = `SELECT b.*, ab2.nickname m2_nickname, p2.product_name p2_name, ab.nickname m1_nickname, p1.product_name p1_name FROM barter b JOIN address_book ab2 ON b.m2_id = ab2.id JOIN products p2 ON b.p2_id = p2.id JOIN address_book ab ON b.m1_id = ab.id JOIN products p1 ON b.p1_id = p1.id WHERE m1_id=${mid3} OR m2_id=${mid3} ORDER BY b.id DESC`
  ;[barter] = await db.query(sql7)

  barter.forEach((item) => {
    item.created_at = dayjs(item.created_at).format('YYYYMMDD')
  })

  let ob = []
  const sql10 = `SELECT * FROM orders_barter`
  ;[ob] = await db.query(sql10)

  let coupon = []
  const sql8 = `SELECT * FROM coupon`
  ;[coupon] = await db.query(sql8)

  const mid5 = +req.query.member_id || 0
  let coupon_r = []
  const sql9 = `SELECT * FROM coupon_received WHERE m_id=${mid5}`
  ;[coupon_r] = await db.query(sql9)

  let purchase_order = []
  const sql11 = `SELECT * FROM purchase_order`
  ;[purchase_order] = await db.query(sql11)

  const mid6 = +req.query.member_id || 0
  let coupon_list = []
  const sql12 = `SELECT * FROM coupon_received cr JOIN coupon c ON cr.coupon_id = c.id WHERE cr.m_id=${mid6} ORDER BY cr.created_at DESC`
  ;[coupon_list] = await db.query(sql12)

  coupon_list.forEach((item) => {
    item.start_date = dayjs(item.start_date).format('YYYY-MM-DD')
    item.end_date = dayjs(item.end_date).format('YYYY-MM-DD')
    item.created_at = dayjs(item.created_at).format('YYYY-MM-DD')
    item.used_at = item.used_at
      ? dayjs(item.used_at).format('YYYY-MM-DD')
      : null
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

  // 分類商品計數
  let totalFree = [[{}]]
  const sqlFree = `SELECT COUNT(*) as totalFree FROM products WHERE category_id = 1`
  ;[[{ totalFree }]] = await db.query(sqlFree)
  let totalComputer = [[{}]]
  const sqlComputer = `SELECT COUNT(*) as totalComputer FROM products WHERE category_id IN (21, 22, 23, 24)`
  ;[[{ totalComputer }]] = await db.query(sqlComputer)
  let totalPhone = [[{}]]
  const sqlPhone = `SELECT COUNT(*) as totalPhone FROM products WHERE category_id IN (25, 26, 27, 28)`
  ;[[{ totalPhone }]] = await db.query(sqlPhone)
  let totalMan = [[{}]]
  const sqlMan = `SELECT COUNT(*) as totalMan FROM products WHERE category_id IN (29, 30, 31, 32, 33, 34, 35)`
  ;[[{ totalMan }]] = await db.query(sqlMan)
  let totalWoman = [[{}]]
  const sqlWoman = `SELECT COUNT(*) as totalWoman FROM products WHERE category_id IN (36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46)`
  ;[[{ totalWoman }]] = await db.query(sqlWoman)
  let totalBeauty = [[{}]]
  const sqlBeauty = `SELECT COUNT(*) as totalBeauty FROM products WHERE category_id IN (47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58)`
  ;[[{ totalBeauty }]] = await db.query(sqlBeauty)
  let totalBrand = [[{}]]
  const sqlBrand = `SELECT COUNT(*) as totalBrand FROM products WHERE category_id IN (59, 60, 61, 62, 63)`
  ;[[{ totalBrand }]] = await db.query(sqlBrand)
  let totalGame = [[{}]]
  const sqlGame = `SELECT COUNT(*) as totalGame FROM products WHERE category_id IN (64, 65, 66)`
  ;[[{ totalGame }]] = await db.query(sqlGame)
  let totalEarphone = [[{}]]
  const sqlEarphone = `SELECT COUNT(*) as totalEarphone FROM products WHERE category_id IN (67, 68, 69, 70, 71)`
  ;[[{ totalEarphone }]] = await db.query(sqlEarphone)
  let totalCamera = [[{}]]
  const sqlCamera = `SELECT COUNT(*) as totalCamera FROM products WHERE category_id IN (72, 73, 74, 75, 76)`
  ;[[{ totalCamera }]] = await db.query(sqlCamera)
  let totalHome = [[{}]]
  const sqlHome = `SELECT COUNT(*) as totalHome FROM products WHERE category_id IN (77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88)`
  ;[[{ totalHome }]] = await db.query(sqlHome)
  let totalEletri = [[{}]]
  const sqlEletri = `SELECT COUNT(*) as totalEletri FROM products WHERE category_id IN (89, 90, 91, 92, 93, 94, 95, 96, 97)`
  ;[[{ totalEletri }]] = await db.query(sqlEletri)
  let totalBaby = [[{}]]
  const sqlBaby = `SELECT COUNT(*) as totalBaby FROM products WHERE category_id IN (98, 99, 100, 101, 102, 103, 104, 105)`
  ;[[{ totalBaby }]] = await db.query(sqlBaby)
  let totalHealth = [[{}]]
  const sqlHealth = `SELECT COUNT(*) as totalHealth FROM products WHERE category_id IN (106, 107, 108, 109, 110)`
  ;[[{ totalHealth }]] = await db.query(sqlHealth)
  let totalSport = [[{}]]
  const sqlSport = `SELECT COUNT(*) as totalSport FROM products WHERE category_id IN (111, 112, 113, 114, 115)`
  ;[[{ totalSport }]] = await db.query(sqlSport)
  let totalDrink = [[{}]]
  const sqlDrink = `SELECT COUNT(*) as totalDrink FROM products WHERE category_id IN (116, 117, 118, 119, 120, 121, 122, 123)`
  ;[[{ totalDrink }]] = await db.query(sqlDrink)
  let totalPet = [[{}]]
  const sqlPet = `SELECT COUNT(*) as totalPet FROM products WHERE category_id IN (124, 125, 126)`
  ;[[{ totalPet }]] = await db.query(sqlPet)
  let totalTicket = [[{}]]
  const sqlTicket = `SELECT COUNT(*) as totalTicket FROM products WHERE category_id IN (127, 128, 129, 130, 131)`
  ;[[{ totalTicket }]] = await db.query(sqlTicket)
  let totalCar = [[{}]]
  const sqlCar = `SELECT COUNT(*) as totalCar FROM products WHERE category_id IN (132, 133, 134, 135, 136, 137, 138)`
  ;[[{ totalCar }]] = await db.query(sqlCar)
  let totalOther = [[{}]]
  const sqlOther = `SELECT COUNT(*) as totalOther FROM products WHERE category_id = 20`
  ;[[{ totalOther }]] = await db.query(sqlOther)

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
    cartProd,
    likeProd,
    totalFree,
    totalComputer,
    totalPhone,
    totalMan,
    totalWoman,
    totalBeauty,
    totalBrand,
    totalGame,
    totalEarphone,
    totalCamera,
    totalHome,
    totalEletri,
    totalBaby,
    totalHealth,
    totalSport,
    totalDrink,
    totalPet,
    totalTicket,
    totalCar,
    totalOther,
    priceOrder,
    dateOrder,
    barter,
    coupon,
    coupon_r,
    ob,
    purchase_order,
    coupon_list,
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

// 商品資料
router.get('/api', async (req, res) => {
  const data = await getListData(req)
  res.json(data)
})

// 詳細商品資料
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

//購物車資料存入SQL
router.post('/api/:pid', async (req, res) => {
  const output = {
    success: false,
    postData: req.body,
    error: '',
    code: 0,
  }

  const productId = req.body.product_id
  const sqlSelect = `SELECT * FROM cart WHERE product_id=?`
  const sqlInsert = `Insert INTO cart (member_id, product_id, p_photos, p_name, p_price, p_qty, total_price, available_cp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  const sqlUpdate = `UPDATE cart SET p_qty =?, total_price =? WHERE product_id = ?`

  try {
    let [existRows] = await db.query(sqlSelect, [productId])

    if (existRows.length > 0) {
      const existingRow = existRows[0]
      const updatedQuantity = existingRow.p_qty + req.body.p_qty
      const updatedTotalPrice = existingRow.p_price * updatedQuantity

      let [updateResult] = await db.query(sqlUpdate, [
        updatedQuantity,
        updatedTotalPrice,
        productId,
      ])

      output.success = !!updateResult.affectedRows
    } else {
      let [insertResult] = await db.query(sqlInsert, [
        req.body.member_id,
        req.body.product_id,
        req.body.p_photos,
        req.body.p_name,
        req.body.p_price,
        req.body.p_qty,
        req.body.p_price * req.body.p_qty,
        req.body.available_cp,
      ])

      output.success = !!insertResult.affectedRows
    }
  } catch (ex) {
    output.error = ex.toString()
  }
  res.json(output)
})

// 購物車
router.get('/cart/:pid', async (req, res) => {
  const pid = +req.params.pid || 0
  if (!pid) {
    return res.json({ success: false })
  }
  const sql = `SELECT * FROM cart WHERE id=${pid}`
  const [rows] = await db.query(sql)
  if (!rows.length) {
    return res.json({ success: false })
  }
  const r = rows[0]
  res.json({ success: true, data: r })
})

// 更新購物車
router.put('/cart/:pid', async (req, res) => {
  const output = {
    success: false,
    postData: req.body,
    error: '',
    code: 0,
  }
  let pid = +req.params.pid || 0

  if (pid) {
    const sqlA = 'UPDATE cart SET p_qty=?, total_price=? WHERE id=?'
    const valuesA = [req.body.p_qty, req.body.total_price, pid]

    const [result] = await db.query(sqlA, valuesA)

    output.success = !!(result.affectedRows && result.changedRows)
    res.json(output)
  } else {
    const sqlB =
      'UPDATE cart SET member_id=? product_id=?, p_qty=?, p_price=?, total_price=? WHERE id=?'
    const valuesB = [
      req.body.member_id,
      req.body.product_id,
      req.body.p_qty,
      req.body.p_price,
      req.body.total_price,
      pid,
    ]
    const [result] = await db.query(sqlB, valuesB)

    output.success = !!(result.affectedRows && result.changedRows)
    res.json(output)
  }
})

// 購物車刪除路由
router.delete('/api/:pid', async (req, res) => {
  const pid = +req.params.pid || 0
  console.log(pid)

  if (pid === 0) {
    return res.json({
      success: false,
      info: '無效的參數',
    })
  }
  const sql = `DELETE FROM cart WHERE id=?`
  const [result] = await db.query(sql, [pid])
  res.json(result)
})

router.delete('/api2', async (req, res) => {
  const sql = `DELETE FROM cart`
  const [result] = await db.query(sql)
  res.json(result)
})

// 收藏清單
router.get('/like-toggle/:pid', async (req, res) => {
  const pid = +req.params.pid || 0
  if (!pid) {
    return res.json({ success: false })
  }
  const sql = `SELECT * FROM products_likes WHERE id=${pid}`
  const [rows] = await db.query(sql)
  if (!rows.length) {
    return res.json({ success: false })
  }
  const r = rows[0]
  res.json({ success: true, data: r })
})

//收藏資料存入SQL
router.post('/like-toggle/:pid', async (req, res) => {
  const member_id = req.query.member_id || 0
  if (!member_id) {
    output.info = '錯誤的會員編號'
    return res.json(output)
  }

  const output = {
    success: false,
    action: '',
    info: '',
  }

  const pid = +req.params.pid || 0
  if (!pid) {
    output.info = '錯誤的商品編號'
    return res.json(output)
  }

  const p_sql = `SELECT id FROM products WHERE id=?`
  const [p_rows] = await db.query(p_sql, [pid])
  if (!p_rows.length) {
    output.info = '沒有該商品'
    return res.json(output)
  }
  const sql = `SELECT * FROM products_likes WHERE member_id=? AND product_id=?`
  const [rows] = await db.query(sql, [member_id, pid])

  if (rows.length) {
    output.action = 'remove'
    const [result] = await db.query(
      `DELETE FROM products_likes WHERE id=${rows[0].id}`
    )
    output.success = !!result.affectedRows
  } else {
    output.action = 'add'
    const sql = `INSERT INTO products_likes (member_id, product_id, p_photos, p_name, p_price, p_qty, total_price, available_cp, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW()) `
    const [result] = await db.query(sql, [
      member_id,
      pid,
      req.body.p_photos,
      req.body.p_name,
      req.body.p_price,
      req.body.p_qty,
      req.body.total_price,
      req.body.available_cp,
    ])
    output.success = !!result.affectedRows
  }
  res.json(output)
})

// 收藏清單刪除路由
router.delete('/like-toggle/:pid', async (req, res) => {
  const pid = +req.params.pid || 0
  console.log(pid)

  if (pid === 0) {
    return res.json({
      success: false,
      info: '無效的參數',
    })
  }
  const sql = `DELETE FROM products_likes WHERE product_id=?`
  const [result] = await db.query(sql, [pid])
  res.json(result)
})

router.delete('/like-toggle2', async (req, res) => {
  const sql = `DELETE FROM products_likes`
  const [result] = await db.query(sql)
  res.json(result)
})

//以物易物資料存入SQL
router.post('/barter', async (req, res) => {
  const output = {
    success: false,
    postData: req.body,
    error: '',
    code: 0,
  }

  const sql =
    'INSERT INTO `barter` (p1_id, p2_id, photo1, photo2, m1_id, m2_id, cp1, cp2, status_reply, status_approve, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 1, NOW())'

  try {
    let [result] = await db.query(sql, [
      req.body.p1_id,
      req.body.p2_id,
      req.body.photo1,
      req.body.photo2,
      req.body.m1_id,
      req.body.m2_id,
      req.body.cp1,
      req.body.cp2,
    ])
    output.success = !!result.affectedRows
  } catch (ex) {
    output.error = ex.toString()
  }

  res.json(output)
})

// 更新以物易物 : agree
router.put('/barter/:id', async (req, res) => {
  const output = {
    success: false,
    postData: req.body,
    error: '',
    code: 0,
  }
  let id = +req.params.id || 0

  const sql =
    'UPDATE barter SET status_reply=?, status_approve=?, approve=? WHERE id=?'
  const values = [
    req.body.status_reply,
    req.body.status_approve,
    req.body.approve,
    id,
  ]

  const [result] = await db.query(sql, values)

  output.success = !!(result.affectedRows && result.changedRows)
  res.json(output)
})

// 更新以物易物 : decline
router.put('/barter2/:id', async (req, res) => {
  const output = {
    success: false,
    postData: req.body,
    error: '',
    code: 0,
  }
  let id = +req.params.id || 0

  const sql =
    'UPDATE barter SET status_reply=?, status_approve=?, approve=? WHERE id=?'
  const values = [
    req.body.status_reply,
    req.body.status_approve,
    req.body.approve,
    id,
  ]

  const [result] = await db.query(sql, values)

  output.success = !!(result.affectedRows && result.changedRows)
  res.json(output)
})

//以物易物邀請存入訂單資料存入SQL
router.post('/order-barter', async (req, res) => {
  const output = {
    success: false,
    postData: req.body,
    error: '',
    code: 0,
  }

  const sql =
    'INSERT INTO `orders_barter` (id, m1_id, m2_id, shipment_fee_m1, shipment_fee_m2, amount_m1, amount_m2, payment_status_m1, payment_status_m2, order_date, complete_status_m1, complete_status_m2) VALUES (?, ?, ?, 60, 60, 1, 1, 1, 1, NOW(), 1, 1)'

  try {
    let [result] = await db.query(sql, [
      req.body.id,
      req.body.m1_id,
      req.body.m2_id,
    ])
    output.success = !!result.affectedRows
  } catch (ex) {
    output.error = ex.toString()
  }

  const sql2 =
    'INSERT INTO `orders_barter_items` (order_id, product_id_1, product_id_2, qty_m1, qty_m2, cps_available_m1, cps_available_m2) VALUES (?, ?, ?, 1, 1, ?, ?)'

  try {
    let [result2] = await db.query(sql2, [
      req.body.id,
      req.body.p1_id,
      req.body.p2_id,
      req.body.cp1,
      req.body.cp2,
    ])
    output.success = !!result2.affectedRows
  } catch (ex) {
    output.error = ex.toString()
  }

  res.json(output)
})

// 以物易物訂單資料
router.get('/order-barter/:id', async (req, res) => {
  const id = +req.params.id || 0
  if (!id) {
    return res.json({ success: false })
  }
  const sql = `SELECT ob.*, obi.order_id, obi.product_id_1 p1_id, obi.product_id_2 p2_id, obi.qty_m1, obi.qty_m2, obi.cps_available_m1 cp1, obi.cps_available_m2 cp2, p1.product_photos p1_photos, p2.product_photos p2_photos, p1.product_name p1_name, p2.product_name p2_name, ab1.nickname m1_nickname, ab2.nickname m2_nickname, ab1.name m1_name, ab2.name m2_name
  FROM orders_barter ob
  JOIN orders_barter_items obi ON ob.id = obi.order_id
  JOIN products p1 ON obi.product_id_1 = p1.id
  JOIN products p2 ON obi.product_id_2 = p2.id
  JOIN address_book ab1 ON p1.seller_id = ab1.id
  JOIN address_book ab2 ON p2.seller_id = ab2.id WHERE ob.id=${id}`
  const [rows] = await db.query(sql)
  if (!rows.length) {
    return res.json({ success: false })
  }
  const r = rows[0]
  const d_o = dayjs(r.order_date)
  r.order_date = d_o.isValid() ? d_o.format('YYYY-MM-DD') : ''

  res.json({ success: true, data: r })
})

// 更新以物易物訂單超商資料m2
router.put('/barter711A/:id', async (req, res) => {
  const output = {
    success: false,
    postData: req.body,
    error: '',
    code: 0,
  }
  let id = +req.params.id || 0

  // TODO: 資料格式檢查
  const formSchema = z.object({
    s_name_m2: z.string().min(2, { message: '名字長度要大於等於2' }),
    s_phone_m2: z.string().regex(/^09\d{2}-?\d{3}-?\d{3}$/, {
      message: '請填寫正確格式的手機號碼',
    }),
  })

  const parseResult = formSchema.safeParse(req.body)
  if (!parseResult.success) {
    output.issues = parseResult.error.issues
    return res.json(output)
  }

  const sql =
    'UPDATE orders_barter SET send_name_m2=?, send_phone_m2=?, name711_m2=?, address711_m2=? WHERE id=?'
  const values = [
    req.body.s_name_m2,
    req.body.s_phone_m2,
    req.body.name711_m2,
    req.body.address711_m2,
    id,
  ]

  const [result] = await db.query(sql, values)

  output.success = !!(result.affectedRows && result.changedRows)
  res.json(output)
})

// 更新以物易物訂單超商資料m1
router.put('/barter711B/:id', async (req, res) => {
  const output = {
    success: false,
    postData: req.body,
    error: '',
    code: 0,
  }
  let id = +req.params.id || 0

  // TODO: 資料格式檢查
  const formSchema = z.object({
    s_name_m1: z.string().min(2, { message: '名字長度要大於等於2' }),
    s_phone_m1: z.string().regex(/^09\d{2}-?\d{3}-?\d{3}$/, {
      message: '請填寫正確格式的手機號碼',
    }),
  })

  const parseResult = formSchema.safeParse(req.body)
  if (!parseResult.success) {
    output.issues = parseResult.error.issues
    return res.json(output)
  }

  const sql =
    'UPDATE orders_barter SET send_name_m1=?, send_phone_m1=?, name711_m1=?, address711_m1=? WHERE id=?'
  const values = [
    req.body.s_name_m1,
    req.body.s_phone_m1,
    req.body.name711_m1,
    req.body.address711_m1,
    id,
  ]

  const [result] = await db.query(sql, values)

  output.success = !!(result.affectedRows && result.changedRows)
  res.json(output)
})

//領取優惠券存入SQL
router.post('/coupon', async (req, res) => {
  const output = {
    success: false,
    postData: req.body,
    error: '',
    code: 0,
  }

  const sql =
    'INSERT INTO `coupon_received` (m_id, coupon_id, created_at) VALUES (?, ?, NOW())'

  try {
    let [result] = await db.query(sql, [req.body.m_id, req.body.coupon_id])
    output.success = !!result.affectedRows
  } catch (ex) {
    output.error = ex.toString()
  }

  res.json(output)
})

// 完成以物易物訂單 : m2
router.put('/ob-complete/:id', async (req, res) => {
  const output = {
    success: false,
    postData: req.body,
    error: '',
    code: 0,
  }
  let id = +req.params.id || 0

  const now = dayjs()
  const formattedTime = now.format('YYYY-MM-DD HH:mm:ss')

  const sql =
    'UPDATE orders_barter SET complete_status_m2=?, complete_date_m2=? WHERE id=?'
  const values = [req.body.complete_status_m2, formattedTime, id]

  const [result] = await db.query(sql, values)

  output.success = !!(result.affectedRows && result.changedRows)
  res.json(output)
})

// 完成以物易物訂單 : m1
router.put('/ob-completeA/:id', async (req, res) => {
  const output = {
    success: false,
    postData: req.body,
    error: '',
    code: 0,
  }
  let id = +req.params.id || 0

  const now = dayjs()
  const formattedTime = now.format('YYYY-MM-DD HH:mm:ss')

  const sql =
    'UPDATE orders_barter SET complete_status_m1=?, complete_date_m1=? WHERE id=?'
  const values = [req.body.complete_status_m1, formattedTime, id]

  const [result] = await db.query(sql, values)

  output.success = !!(result.affectedRows && result.changedRows)
  res.json(output)
})

export default router
