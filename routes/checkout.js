import express from 'express'
import db from '../utils/mysql2-connect.js'
import upload from '../utils/upload-imgs.js'
import dayjs from 'dayjs'
import { z } from 'zod'

const router = express.Router()

const getListData = async (req, res) => {
  let keyword = req.query.keyword || ''
  const qs = {} //用來記錄query string 參數

  let where = ' WHERE 1 '
  if (keyword) {
    //避免 SQL injection
    where += ` AND (
      \'name\' LIKE ${db.escape(`%${keyword}%`)} 
        OR  
        \'mobile\' LIKE ${db.escape(`%${keyword}%`)}
        ) 
        `
  }

  res.locals.pageName = 'buyer_orders'
  res.locals.title = '訂單後台' + res.locals.title
  const perPage = 20 //每頁最多幾筆
  const sql = `SELECT COUNT(1) totalRows FROM orders od  ${where} `
  const [[{ totalRows }]] = await db.query(sql)
  const totalPages = Math.ceil(totalRows / perPage)

  let page = +req.query.page || 1
  if (page < 1) {
    return res.redirect('?page=1')
  }

  let rows = []

  if (totalRows > 0) {
    if (page > totalPages) {
      return res.redirect(`?page=${totalPages}`)
    }
    const sql2 = `SELECT  *,seller_ab.name AS seller_name, buyer_ab.name AS buyer_name FROM orders 
    INNER JOIN address_book as seller_ab
   ON orders.seller_id= seller_ab.id 
   INNER JOIN address_book  as buyer_ab
   ON orders.buyer_id=buyer_ab.id  
   INNER JOIN orders_items 
    ON orders_items.order_id =orders.id  
    INNER JOIN products 
     ON orders_items.product_id=products.id
    
    ${where} 
     ORDER BY orders.id DESC LIMIT ${(page - 1) * perPage},${perPage}`
    ;[rows] = await db.query(sql2)
  }

  rows.forEach(
    (item) => (item.order_date = dayjs(item.order_date).format('YYYY-MM-DD'))
  )

  // res.json({ totalPages, totalRows, rows });
  return {
    totalPages,
    totalRows,
    rows,
    perPage,
    page,
    keyword,
    qs: req.query,
  }
}

const getProductData = async (req, res) => {
  // SELECT * FROM `address_book` WHERE `name` LIKE '%詩涵%'
  let keyword = req.query.keyword || ''

  let where = ' WHERE 1 '
  if (keyword) {
    // 避免 SQL injection
    where += ` AND (
    p.\`name\` LIKE ${db.escape(`%${keyword}%`)} 
    OR
    p.\`mobile\` LIKE ${db.escape(`%${keyword}%`)}
    )
    `
  }

  let redirect = '' // 作為轉換依據的變數
  const perPage = 20 // 每頁最多幾筆
  const sql = `SELECT COUNT(1) totalRows FROM products p ${where}`
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
    const sql2 = `SELECT p.* FROM products p

    
    ${where} ORDER BY id DESC LIMIT ${(page - 1) * perPage}, ${perPage}`
    ;[rows] = await db.query(sql2)
  }
  rows.forEach((item) => {
    // 把 birthday 欄位的值轉換成 "YYYY-MM-DD" 格式的字串
    const d = dayjs(item.birthday)
    item.birthday = d.isValid() ? d.format('YYYY-MM-DD') : ''
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

// router.use((req, res, next) => {
//   /*
//   const whiteList = ["/", "/api"];
//   let path = req.url.split("?")[0]; //去掉query string
//   if (!whiteList.includes(path)) {
//     //如果不在白名單哩
//     if (!req.session.admin) {
//       // 如果不在白名單裡, 必須要有權限
//       return res.status(403).send("<h1>無權訪問此頁面</h1>");
//     }
//   }
//   */
//   next();
// });

router.get('/', async (req, res) => {
  const data = await getListData(req, res)
  res.render('buyer-orders/list', data)
})

//----
router.get('/api', async (req, res) => {
  const data = await getListData(req, res)
  res.json(data)
})

//取得優惠卷(coupon)
router.get('/coupon', async (req, res) => {
  let where = ' WHERE 1 '
  const sql = ` SELECT * FROM  \`coupon_received\`   ${where} `
  const [rows] = await db.query(sql)
  res.json(rows)
})

//----- 新增資料
//呈現新增表單
// router.get('/add', async (req, res) => {
//   res.render('buyer-orders/add')
// })

//處理新增表單
router.post('/add/multi', async (req, res) => {
  //TODO:資料格式檢查
  const sql =
    'INSERT INTO `orders`( `class`, `seller_id`, `buyer_id`, `total_price`, `total_amount`, `shipment_fee`, `payment_status`, `payment_way`, `shipment_status`, `discount_cp`, `discount_coupon`, `complete_status`, `complete_date`, `order_date`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())'
  const [result] = await db.query(sql, [
    req.body.class,
    req.body.seller_id,
    req.body.buyer_id,
    req.body.total_price,
    req.body.total_amount,
    req.body.shipment_fee,
    req.body.payment_status,
    req.body.payment_way,
    req.body.shipment_status,
    req.body.discount_cp,
    req.body.discount_coupon,
    req.body.complete_status,
    req.body.complete_date,
    req.body.order_date,
  ])

  res.json(req.body)
})

//--取得商品資料

const getProduct = async (req, res) => {
  const reqId = req.body.product_id
  const sql = ` SELECT id, seller_id, product_name ,product_price 
    FROM products 
     WHERE id=${reqId} `
  const [rows] = await db.query(sql)
  return { success: true, rows }
}

let cachedProductId = null // 用于缓存产品 ID 的变量

router.post('/product-api2', async (req, res, next) => {
  try {
    // 1. 获取请求正文中的产品 ID
    const reqId = req.body.product_id

    // 2. 将产品 ID 存储到缓存中
    cachedProductId = reqId

    // 3. 返回产品 ID
    res.json({ success: true, message: 'Product ID stored successfully' })
  } catch (error) {
    console.error('Error storing product ID:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})
router.get('/product-api', async (req, res) => {
  try {
    let reqId
    // 如果有缓存的产品 ID，则使用缓存的 ID
    if (cachedProductId !== null) {
      reqId = cachedProductId
    } else {
      // 否则，从查询参数中获取产品 ID
      reqId = req.query.product_id
    }

    // 2. 构建 SQL 查询语句
    const sql = `SELECT id, seller_id, product_name, product_price
                 FROM products
                 WHERE id = ?` // 使用占位符以防止 SQL 注入攻击

    // 3. 执行查询
    const [rows] = await db.query(sql, [reqId])

    // 4. 返回查询结果
    res.json({ rows })
  } catch (error) {
    console.error('Error fetching product:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

//取得購物車的商品資料
router.get('/product-api-shop', async (req, res) => {
  try {
    let reqId = req.query.id || ''
    // 如果有缓存的产品 ID，则使用缓存的 ID
    if (reqId !== null) {
      // 2. 构建 SQL 查询语句
      const sql = `SELECT cart.id, member_id, product_id , p_name, p_price , p_qty , total_price , available_cp , p.seller_id as seller_id  
                 FROM cart
                 INNER JOIN products as p 
                 ON p.id = cart.product_id 
                
                 WHERE member_id = ?` // 使用占位符以防止 SQL 注入攻击

      // 3. 执行查询
      const [rows] = await db.query(sql, [reqId])
      //取得優惠卷資料
      const sqlC = ` SELECT * FROM  coupon  as cp 
      inner join  coupon_received as cr  
      on cr.coupon_id = cp.id
      WHERE cr.m_id = ?`
      const [cp] = await db.query(sqlC, [reqId])
      //取得小炭點資料
      const sqlt = ` SELECT * FROM  address_book   
      WHERE id = ?`
      const [ct] = await db.query(sqlt, [reqId])
      // 4. 返回查询结果
      res.json({ rows, cp, ct })
    }
  } catch (error) {
    console.error('Error fetching product:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// form from next buyer-orders
router.get('/add', async (req, res) => {
  res.send('add')
})
router.post('/add', async (req, res) => {
  //TODO:資料格式檢查
  for (let j = 0; j < req.body.seller_id.length; j++) {
    const sql =
      'INSERT INTO `orders`( `class`, `seller_id`, `buyer_id`, `total_price`, `total_amount`, `shipment_fee`, `payment_status`, `payment_way`, `shipment_status`, `discount_cp`, `discount_coupon`, `complete_status`, `complete_date`, `order_date`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())'
    const [result] = await db.query(sql, [
      req.body.class,
      req.body.seller_id[j],
      req.body.buyer_id,
      req.body.total_price[j],
      req.body.total_amount[j],
      req.body.shipment_fee[j],
      // req.body.payment_status,
      1,
      req.body.payment_way,
      // req.body.shipment_status,
      1,
      // req.body.discount_cp,
      1,
      req.body.discount_coupon[j],
      // req.body.complete_status,
      1,
      // req.body.complete_date,
      0,
      req.body.order_date,
    ])

    const ordersId = ' SELECT id FROM orders ORDER BY id  DESC LIMIT 1'
    const lastInsertId = result.insertId
    console.log(lastInsertId)

    const sql2 =
      'INSERT INTO `orders_items` ( `order_id`, `product_id`, `item_price`, `item_qty`, `carbon_points_available`, `after_bargin_price` ) VALUES (?,?,?,?,?,?)'

    for (let i = 0; i < req.body.product_id.length; i++) {
      const [result2] = await db.query(sql2, [
        lastInsertId,
        req.body.product_id[i],
        req.body.product_price[i],
        req.body.item_qty[i],
        req.body.carbon_points_available[i],
        req.body.after_bargin_price,
        //   // req.body.product_id,
        //   // req.body.item_price,

        //   // req.body.after_bargin_price,
        //   // req.body.rating,
        //   // req.body.comments,
        //   // req.body.evalution_date,
      ])
    }
  }

  res.json(req.body)
})

//----
export default router
