import express from 'express'
import db from './../utils/mysql2-connect.js'
import upload from './../utils/upload-imgs.js'
import dayjs from 'dayjs'
import { z } from 'zod'
import cookieParser from 'cookie-parser'
/*
我的最愛的資料庫
SELECT ab.* , pl.sid like_sid FROM `address_book` ab

LEFT JOIN 
(SELECT * FROM `product_likes` WHERE member_sid=?)
product_likes pl ON ab.sid=pl.product_sid

ORDER BY ab.sid DESC   LIMIT 0,25
*/

const router = express.Router()
router.use(cookieParser())

const getOrderListData = async (req, res) => {
  //SELECT * FROM `address_book` WHERE `name` LIKE '%詩涵%'
  let keyword = req.query.keyword || ''

  //TODO:日期的格式檢查
  let date_begin = req.query.date_begin || ''
  if (date_begin) {
    date_begin = dayjs(date_begin, 'YYYY-MM-DD', true) //dayjs物件
    //如果是合法的日期格，就轉換成日期的字串，否則設定為空值
    date_begin = date_begin.isValid() ? date_begin.format('YYYY-MM-DD') : null
  }

  let date_end = req.query.date_end || ''
  if (date_end) {
    date_end = dayjs(date_end, 'YYYY-MM-DD', true) //dayjs物件
    //如果是合法的日期格，就轉換成日期的字串，否則設定為空值
    date_end = date_end.isValid() ? date_end.format('YYYY-MM-DD') : null
  }
  let whereMain = ' WHERE 1 '
  let where = ' WHERE 1 '

  let memberId = req.query.id || ''
  if (memberId) {
    whereMain += ` AND  o.buyer_id=${memberId}`
  }

  // //检查是否存在用户会员ID的会话或cookie
  // if (req.cookies && req.cookies.auth) {
  //   member_sid = req.cookies.auth.userData.id // 从 cookie 中获取会员ID
  // }
  // if (member_sid) {
  //   where += ` AND  buyer_ab.id=${member_sid}`
  // }
  //使用会员ID执行查询
  //   let subQuery = `
  // (
  //   SELECT * FROM orders WHERE buyer_ab.id=${member_sid}
  // ) pl `

  /*
  // let qs = {} //紀錄 query string 參數
  // let subQuery = ''

  // if (res.locals.jwt && res.locals.jwt.id) {
  //   subQuery = `(SELECT * FROM product_likes WHERE member_id=${res.locals.jwt.id}) pl`
  // }


  // /*
  // if (res.locals.jwt && res.locals.jwt.id) {
  //   //如果有jwt授權
  //   where += ` AND pl.member_sid=${res.locals.jwt.id}`;
  // }
  */
  // if (keyword) {
  //   //避免SQL injection
  //   where += ` AND ( ab.\`name\` LIKE ${db.escape('%' + keyword + '%')}) OR
  //   ( ab.\`mobile\` LIKE ${db.escape('%' + keyword + '%')})`
  // }

  //如果用戶有設定篩選生日起始時間
  if (date_begin) {
    where += ` AND ab.\`birthday\` >=${db.escape(date_begin)} `
  }
  //如果用戶有設定篩選生日結束時間
  if (date_end) {
    where += ` AND ab.\`birthday\` <= '${date_end}' `
    //sql語法，日期要用單引號包住
  }

  let redirect = '' //作為轉向依據的變數
  const perPage = 20 //每頁最多幾筆
  const sql = `SELECT COUNT(1) totalRows FROM address_book ab ${where}`
  let page = +req.query.page || 1
  if (page < 1) {
    redirect = '?page=1'
    return { success: false, redirect }
  }

  //多層的展開
  const [[{ totalRows }]] = await db.query(sql)
  const totalPages = Math.ceil(totalRows / perPage)

  let rows = []
  if (totalPages > 0) {
    if (page > totalPages) {
      redirect = `?page=${totalPages}`
      return { success: false, redirect }
    }
    const sql2 = `SELECT orders_items.item_qty item_qty, orders_items.item_price item_price, o.total_amount total_amount, o.shipment_fee shipment_fee, o.discount_cp cp, o.discount_coupon coupon, o.payment_status, o.id , o.shipment_status , o.complete_status , o.buyer_id , o. seller_id , o.total_price , o.order_date , seller_ab.nickname AS seller_name, buyer_ab.name AS buyer_name , buyer_ab.carbon_points_got as buyer_point , p.id as p_id , p.product_name as product_name , p.product_photos as product_photos,orders_items.id as items_id
    
    FROM orders as o  
    
    INNER JOIN address_book  as buyer_ab
    ON o.buyer_id=buyer_ab.id  
    INNER JOIN address_book as seller_ab
    ON o.seller_id= seller_ab.id  
    INNER JOIN orders_items 
    ON orders_items.order_id =o.id  
    INNER JOIN products as p 
    ON orders_items.product_id=p.id
    ${whereMain} ORDER BY o.id  DESC
    LIMIT ${(page - 1) * perPage}, ${perPage}`
    ;[rows] = await db.query(sql2)
  }
  rows.forEach((item) => {
    //把birthday欄位的值轉換成"YYYY-MM-DD"
    const d = dayjs(item.birthday)
    item.birthday = d.isValid() ? d.format('YYYY-MM-DD') : ''
  })

  //res.json({ totalRows, perPage, totalPages, rows });

  return {
    totalRows,
    perPage,
    totalPages,
    page,
    rows,
    keyword,
    qs: req.query,
  }
}

router.use((req, res, next) => {
  /*
  const whiteList = ["/", "/api"];
  let path = req.url.split("?")[0]; //去掉query string
  if (!whiteList.includes(path)) {
    //如果不在白名單哩
    if (!req.session.admin) {
      // 如果不在白名單裡, 必須要有權限
      return res.status(403).send("<h1>無權訪問此頁面</h1>");
    }
  }
  */
  next()
})

router.get('/', async (req, res) => {
  res.locals.pageName = 'address_book'
  res.locals.title = '通訊錄列表' + res.locals.title
  const data = await getOrderListData(req, res)
  if (data.redirect) {
    return res.redirect(data.redirect)
  }
  if (req.session.admin) {
    res.render('address_book/list', data)
  } else {
    res.render('address_book/list-no-admin', data)
  }
})

router.get('/api', async (req, res) => {
  const data = await getOrderListData(req, res)

  res.json(data)
})

//order-list detail
router.get('/api/:id', async (req, res) => {
  const data = await getOrderListData(req, res)
  console.log(req.cookies.auth)
  res.json(data)
})

router.put('/edit/:id', async (req, res) => {
  const output = {
    success: false,
    postData: req.body,
    error: '',
    code: 0,
  }

  let id = +req.params.id || 0

  // TODO: 資料格式檢查

  const sql =
    'UPDATE `orders` SET complete_status=? , complete_date = NOW() WHERE id=?'
  try {
    // 執行 SQL 時最好做錯誤處理
    const [result] = await db.query(sql, [
      req.body.complete_status,
      req.body.id,
    ])
    console.log(req.body)
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

router.get('/example', (req, res) => {
  // 获取名为 'myCookie' 的 cookie 的值
  const myCookieValue = req.cookies
  res.json({ myCookieValue })
  // 在这里使用 cookie 值进行其他操作
})

export default router
