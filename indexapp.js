import express, { json } from 'express'
// import sales from "./data/sales.json" assert { type: "json" };
import session from 'express-session'
import mysql_session from 'express-mysql-session'
import moment from 'moment-timezone'
import dayjs from 'dayjs'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import db from './utils/mysql2-connect.js'
import upload from './utils/upload-imgs.js'
// import admin2Router from './routes/admin2.js'
// import abRouter from './routes/adress_book.js'
import boRouter from './routes/buyer-order.js'
import bargainRouter from './routes/bargain.js'
import checkoutRouter from './routes/checkout.js'

import evaRouter from './routes/evaluation.js'

//import wsServer from "./routes/ws-chat.js";

const MysqlStore = mysql_session(session)
const sessionStore = new MysqlStore({}, db)

const app = express()

app.set('view engine', 'ejs') //設定使用中的樣板引擎為EJS

//top-level middleware
//true:使用qs套件作為解析器的核心
//false:使用body-parser自己的解析器(中介)
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

const corsOptions = {
  credentials: true,
  origin: (origin, callback) => {
    // console.log({ origin });
    callback(null, true)
  },
}
app.use(cors(corsOptions))
app.use(
  session({
    saveUninitialized: false,
    resave: false,
    secret: 'kkdduuii', //secret內容隨便填即可
    store: sessionStore,
    /*
    cookie:{
      maxAge:20*60*1000  //單位是毫秒
    }
    */
  })
)

//自訂頂層的中介軟體
app.use((req, res, next) => {
  res.locals.title = 'MyWeb'
  res.locals.pageName = ''
  res.locals.session = req.session //把session資料傳到ejs

  const authorization = req.get('Authorization')
  if (authorization && authorization.indexOf('Bearer ') === 0) {
    const token = authorization.slice(7) //去掉 Bearer

    //JWT 解密
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET)
      res.locals.jwt = payload //透過 res 往下傳
    } catch (ex) {}
  }

  //測試時使用的假資料

  res.locals.jwt = {
    id: 25,
    account: 'fake@fake.com',
  }

  next() //流程往下進行
})
//登入後回傳 JWT
app.post('/login-jwt', async (req, res) => {
  const output = {
    success: false,
    body: req.body,
  }
  const { account, password } = req.body

  const sql = 'SELECT * FROM members WHERE email=?'
  const [rows] = await db.query(sql, [account])

  if (!rows.length) {
    // 帳號是錯誤的
    return res.json(output)
  }

  const result = await bcrypt.compare(password, rows[0].password)
  output.success = result
  if (result) {
    const token = jwt.sign(
      {
        id: rows[0].id,
        account,
      },
      process.env.JWT_SECRET
    )

    // 使用 JWT
    output.data = {
      id: rows[0].id,
      account,
      nickname: rows[0].nickname,
      token,
    }
  }
  res.json(output)
})

app.get('/jwt-data', (req, res) => {
  res.json(res.locals.jwt)
})

//路由(routes)設定
//只允許GET方法來拜訪這個路徑
app.get('/', (req, res) => {
  res.locals.title = '首頁-' + res.locals.title
  res.locals.pageName = ''
  res.render('home', { name: 'Jim>"<' })
})

app.get('/try-db', async (req, res) => {
  const sql = `SELECT  *,seller_ab.name AS seller_name, buyer_ab.name AS buyer_name FROM orders 
     INNER JOIN address_book as seller_ab
    ON orders.seller_id= seller_ab.id 
    INNER JOIN address_book  as buyer_ab
    ON orders.buyer_id=buyer_ab.id   
    LIMIT 10 `
  let rows = []

  try {
    [rows] = await db.query(sql)
  } catch (ex) {
    console.log(ex)
  }

  res.json({ rows })
})

//----訂單路由---
app.use('/buyer-order', boRouter)
app.use('/checkout', checkoutRouter)
app.use('/evaluation', evaRouter)
app.use('/bargain', bargainRouter)

//***路由放在此之前***
//設定靜態內容資料夾
app.use(express.static('public'))
app.use('/jquery', express.static('node_modules/jquery/dist'))
app.use('/bootstrap', express.static('node_modules/bootstrap/dist'))

//404頁面
//***路由放在此之前***
app.use((req, res) => {
  res.status(404).send('<h2>error</h2>')
})

const port = process.env.WEB_PORT || 3002
app.listen(port, () => {
  console.log(`使用通訊埠${port}`)
})
