import express from 'express'
import homeRouter from './routes/home.js'
import prodRouter from './routes/products.js'

import session from 'express-session'
import mysql_session from 'express-mysql-session'
//import dayjs from 'dayjs'
import db from './utils/mysql2-connect.js'
import cors from 'cors'
//import bcrypt from 'bcryptjs'
//import wsServer from "./routes/ws-chat.js";
//import wsServer from './routes/ws-draw.js'

// *** 將session資料存入MySQL
const MysqlStore = mysql_session(session)
// 建立儲存的地方: 設定一開始為空物件, 並放入db, 將會建立出一張新的SQL資料表
const sessionStore = new MysqlStore({}, db)

// ***建立server
const app = express()

// ***set設定要在路由之前, 此段是設定使用的template樣板引擎為EJS
app.set('view engine', 'ejs')

// ***top level middlewares設定, 只能用use, 在路由之前做設定
//透過判斷檔頭類型決定使用哪一個middleware
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

// 設定回應的擋頭, 允許跨來源
const corsOptions = {
  credentials: true,
  origin: (origin, callback) => {
    console.log({ origin })
    // 沒有白名單(有在名單上才可執行), 允許所有的
    callback(null, true)
  },
}
app.use(cors())
// 設定session
app.use(
  session({
    saveUninitialized: false,
    resave: false,
    secret: 'eadgeagrgsdfsdf',
    /*
  cookie: {
    // session的存活時間, 沒有設定的話就會用瀏覽器預設的
    maxAge: 1200_000,    //單位是毫秒, 底線是像,三位分隔
  }
  */
    // session儲存的地方
    store: sessionStore,
  })
)
// Z為格林威治標準時間

// 自訂頂層的中介軟體
app.use((req, res, next) => {
  res.locals.title = 'DEAL 2ND HAND SHOP'
  res.locals.pageName = ''
  res.locals.session = req.session

  next()
})

/*
//前端路由，若有後端路由要寫在這兩段之上
app.use(express.static('build'));
// *表示全部的頁面
app.get("*", (req, res)=>{
  res.send(`<!doctype html><html lang="zh"><head><meta charset="utf-8"/><link rel="icon" href="/favicon.ico"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="theme-color" content="#000000"/><meta name="description" content="Shinder react hooks"/><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css"/><title>Shinder react hooks</title><script defer="defer" src="/static/js/main.6a205622.js"></script></head><body><noscript>You need to enable JavaScript to run this app.</noscript><div id="root"></div></body></html>`)
});
*/

// ***設定路由(routes), 路由一定要/開頭, 否則是沒有效果的
app.use('/', homeRouter)

app.use('/products', prodRouter)

// app.use('/api/auth', authRouter)
// app.use('/api/users', usersRouter)
// app.use('/api/reset-password', resetRouter)
// app.use('/api/google-login', googleRouter)

//upload.none():表示沒有要上傳,但是可以做multipart/form-data的解析
// 若有多個欄位內有多個檔案要上傳: field; 若有單一欄位有多個檔案要上傳: array; 若單一欄位單一檔案時用single
//app.post("/try-upload", upload.single("avatar"), (req, res) => {
//res.json(req.file);
//});   //只可以使用multipart/form-data的格式

// 路由一定要符合才會找到對應網頁
// ":"冒號之後為變數代稱設定路由(動態路由)
// "?"放在變數代稱之後表示不一定要有
// 兩個類似的路徑, 嚴謹的放前面

//適用2層以下的分類
app.get('/cate2/:api?', async (req, res) => {
  const data = []
  const [rows] = await db.query('SELECT * FROM categories ORDER BY id DESC')

  // 先取得第一層的資料
  for (let item of rows) {
    if (+item.parent_id === 0) {
      data.push(item)
    }
  }

  //第二層的項目放在所屬的第一層底下
  for (let a1 of data) {
    // 拿資料表每一個項目
    for (let item of rows) {
      if (+a1.id === +item.parent_id) {
        a1.nodes = a1.nodes || [] //設定陣列, 如果原本有就傳原本的陣列;沒有就建立空陣列
        a1.nodes.push(item)
      }
    }
  }
  if (req.params.api === 'api') {
    res.json(data)
  } else {
    res.render('cate1', { data })
  }
  //res.json(data);
})

// 適用分類有2層以上皆可
app.get('/cate1/:api?', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM categories ORDER BY id DESC')
  // primary key當作key物件,對表用
  const dict = {}
  for (let i of rows) {
    dict[i.id] = i
  }
  // 上下的關係建立起來
  for (let i of rows) {
    // 如果 i 這個項目有上一層
    if (i.parent_id) {
      const parent = dict[i.parent_id] // 取得它的上一層
      parent.nodes ||= [] // 等於parent.nodes = parent.nodes || []的意思
      parent.nodes.push(i)
    }
  }
  const data = []
  for (let i of rows) {
    if (!i.parent_id) {
      data.push(i)
    }
  }
  res.json(data)
})

// 收藏功能
app.get('/like-toggle/:pid', async (req, res) => {
  const member_id = 20 //測試的假資料
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
  /*
  // pl.*: 表示只要pl這張表的所有欄位
  const sql = `SELECT pl.* FROM product_likes as pl
    JOIN products as p ON pl.product_id = p.id
    WHERE pl.product_id=? AND pl.member_id=?`;
  const [rows] = await db.query(sql, [pid, member_id]);
  */
  //判斷是否有該項商品
  const p_sql = `SELECT id FROM products WHERE id=?`
  const [p_rows] = await db.query(p_sql, [pid])
  if (!p_rows.length) {
    output.info = '沒有該商品'
    return res.json(output)
  }
  const sql = `SELECT * FROM product_likes WHERE product_id=? AND member_id=?`
  const [rows] = await db.query(sql, [pid, member_id])

  if (rows.length) {
    //有資料的話就移除
    output.action = 'remove'
    const [result] = await db.query(
      `DELETE FROM product_likes WHERE id=${rows[0].id}`
    )
    output.success = !!result.affectedRows
  } else {
    // 沒有資料的話就加入
    output.action = 'add'
    const sql = `INSERT INTO product_likes (product_id, member_id) VALUES (?, ?) `
    const [result] = await db.query(sql, [pid, member_id])
    output.success = !!result.affectedRows
  }
  res.json(output)
})

// ***靜態內容***
app.use(express.static('public'))
app.use('/jquery', express.static('node_modules/jquery/dist'))
app.use('/bootstrap', express.static('node_modules/bootstrap/dist'))

// ***製作404頁面***
app.use((req, res) => {
  res.status(404).send('<h2>404 找不到頁面</h2>')
})

const port = process.env.WEB_PORT || 3002
// 監聽通訊埠
app.listen(port, () => {
  console.log(`使用通訊埠 ${port}`)
})
