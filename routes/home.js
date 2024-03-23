import express from 'express'
import db from '../utils/mysql2-connect.js'

const router = express.Router()

router.use((req, res, next) => {
  let path = req.url.split('?')[0]
  if (!path == '/login') {
    if (!req.session.admin || !req.session.user) {
      return res.status(403).send('<h1>無權訪問這頁面</h1>')
    }
  }
  next()
})

router.get('/', async (req, res) => {
  res.locals.title = '首頁 - ' + res.locals.title
  res.locals.pageName = 'home'

  try {
    const [rows1] = await db.query(
      'SELECT COUNT(*) as addressBookCount FROM address_book'
    )
    res.locals.addressBookCount = rows1[0].addressBookCount

    const [rows2] = await db.query(
      'SELECT COUNT(*) as productsCount FROM products'
    )
    res.locals.productsCount = rows2[0].productsCount

    const [rows3] = await db.query('SELECT COUNT(*) as ordersCount FROM orders')
    res.locals.ordersCount = rows3[0].ordersCount

    const [rows4] = await db.query(
      'SELECT COUNT(*) as evaluationsCount FROM evaluations'
    )
    res.locals.evaluationsCount = rows4[0].evaluationsCount

    const [rows5] = await db.query('SELECT COUNT(*) as couponCount FROM coupon')
    res.locals.couponCount = rows5[0].couponCount

    // home 不須設定副檔名, name 的部分會進到 home 內變成變數
    res.render('home')
  } catch (error) {
    console.error(error)
    res.status(500).send('Internal Server Error')
  }
})
// res.send會設定檔頭的Content-type, 同時和res.render出現雖然還是可以跑出來但是會有衝突, 不用的要註解掉

export default router
