import express from 'express'
import prodRouter from './routes/products.js'
import shipRouter from './routes/shipment.js'
import linepayRouter from './routes/line-pay.js'
import session from 'express-session'
import mysql_session from 'express-mysql-session'
import db from './utils/mysql2-connect.js'
import cors from 'cors'
import boRouter from './routes/buyer-order.js'
import bargainRouter from './routes/bargain.js'
import checkoutRouter from './routes/checkout.js'
import cookieParser from 'cookie-parser'
import evaRouter from './routes/evaluation.js'
import BAckstage from './routes/backstage.js'
import unpaidRouter from './routes/unpaid-maket.js'
import ListRouter from './routes/list-maket.js'
import ListpostRouter from './routes/list-post.js'
import ListeditRouter from './routes/list-maket-edit.js'
import BackstageManagerRouter from './routes/backstage-manager.js'

// *** 將session資料存入MySQL
const MysqlStore = mysql_session(session)
const sessionStore = new MysqlStore({}, db)

// ***建立server
const app = express()

// ***set設定要在路由之前, 此段是設定使用的template樣板引擎為EJS
app.set('view engine', 'ejs')

// ***top level middlewares設定
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
    // session儲存的地方
    store: sessionStore,
  })
)

// 自訂頂層的中介軟體
app.use((req, res, next) => {
  res.locals.title = 'DEAL 2ND HAND SHOP'
  res.locals.pageName = ''
  res.locals.session = req.session

  next()
})

// ***設定路由(routes), 路由一定要/開頭, 否則是沒有效果的
// Raye:
app.use('/products', prodRouter)
app.use('/shipment', shipRouter)
app.use('/line-pay', linepayRouter)

// Chen:
app.use('/backstage', BAckstage)
app.use('/unpaid-maket', unpaidRouter)
app.use('/list-maket', ListRouter)
app.use('/list-post', ListpostRouter)
app.use('/list-maket-edit', ListeditRouter)
app.use('/backstage-manager', BackstageManagerRouter)

// Kai:
app.use(cookieParser())
app.use('/buyer-order', boRouter)
app.use('/checkout', checkoutRouter)
app.use('/evaluation', evaRouter)
app.use('/bargain', bargainRouter)

// ***靜態內容***
app.use(express.static('public'))
app.use('/jquery', express.static('node_modules/jquery/dist'))
app.use('/bootstrap', express.static('node_modules/bootstrap/dist'))

// ***製作404頁面***
app.use((req, res) => {
  res.status(404).send('<h2>404 找不到頁面</h2>')
})

const port = process.env.WEB_PORT || 3002
// ***監聽通訊埠***
app.listen(port, () => {
  console.log(`使用通訊埠 ${port}`)
})
