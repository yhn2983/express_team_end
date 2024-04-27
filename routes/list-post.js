import express from 'express'
import db from './../utils/mysql2-connect.js'
import upload from './../utils/upload-imgs.js'
import dayjs from 'dayjs'
import { z } from 'zod'
import multer from 'multer'

const router = express.Router()
/*
如果以同時查詢 [加到最愛] 的資料
通訊錄當作產品

SELECT ab.*, pl.sid like_sid FROM `address_book` ab 
LEFT JOIN  (
  SELECT * FROM `product_likes` WHERE member_sid=?
) pl ON ab.sid= pl.product_sid
ORDER BY ab.sid DESC LIMIT 0, 25

*/
const getListData = async (req, res) => {
  // // SELECT * FROM `address_book` WHERE `name` LIKE '%詩涵%'
  let keyword = req.query.keyword || ''

  // let date_begin = req.query.date_begin || null
  // if (date_begin) {
  //   // 日期的格式檢查
  //   date_begin = dayjs(date_begin, 'YYYY-MM-DD', true) // dayjs 物件
  //   // 如果是合法的日期格式, 就轉換為日期的字串, 否則設定為空值
  //   date_begin = date_begin.isValid() ? date_begin.format('YYYY-MM-DD') : null
  // }
  // let date_end = req.query.date_end || null
  // if (date_end) {
  //   date_end = dayjs(date_end, 'YYYY-MM-DD', true) // dayjs 物件
  //   // 如果是合法的日期格式, 就轉換為日期的字串, 否則設定為空值
  //   date_end = date_end.isValid() ? date_end.format('YYYY-MM-DD') : null
  // }

  let member_sid = 0 // 預設值為  0
  // if (res.locals.jwt && res.locals.jwt.id) {
  //   // 如果有 JWT 授權
  //   member_sid = res.locals.jwt.id
  // }
  let subQuery = `
  (
    SELECT * FROM products WHERE member_sid=${member_sid}
  ) pl `

  let where = ' WHERE 1 '
  if (keyword) {
    // 避免 SQL injection
    where += ` AND (
    ab.\`name\` LIKE ${db.escape(`%${keyword}%`)}
    OR
    ab.\`mobile\` LIKE ${db.escape(`%${keyword}%`)}
    )
    `
  }

  // // 如果用戶有設定篩選生日的起始日期
  // if (date_begin) {
  //   where += ` AND  ab.\`birthday\` >= ${db.escape(date_begin)} `
  // }
  // // 如果用戶有設定篩選生日的結束日期
  // if (date_end) {
  //   where += ` AND  ab.\`birthday\` <= '${date_end}' `
  // }

  let redirect = '' // 作為轉換依據的變數
  const perPage = 20 // 每頁最多幾筆
  const sql = `SELECT COUNT(1) totalRows FROM address_book ab ${where}`
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
    const sql2 = `SELECT ab.*, pl.sid like_sid FROM products ab
    LEFT JOIN  ${subQuery} ON ab.sid=pl.product_sid
    
    ${where} ORDER BY sid DESC LIMIT ${(page - 1) * perPage}, ${perPage}`
    ;[rows] = await db.query(sql2)
  }
  rows.forEach((item) => {
    // 把 birthday 欄位的值轉換成 "YYYY-MM-DD" 格式的字串
    const d = dayjs(item.created_at)
    item.created_at = d.isValid() ? d.format('YYYY-MM-DD') : ''
  })

  rows.forEach((item) => {
    // 把 birthday 欄位的值轉換成 "YYYY-MM-DD" 格式的字串
    const d = dayjs(item.edited_at)
    item.edited_at = d.isValid() ? d.format('YYYY-MM-DD') : ''
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

router.use((req, res, next) => {
  /*
  const whiteList = ["/", "/api"];
  let path = req.url.split("?")[0]; // 去掉 query string

  if (!whiteList.includes(path)) {
    // 如果沒有在白名單裡
    if (!req.session.admin) {
      // 如果不在白名單裡, 必須要有權限
      return res.status(403).send("<h1>無權訪問此頁面</h1>");
    }
  }
  */
  next()
})

router.get('/', async (req, res) => {
  res.locals.pageName = 'ab_list'
  res.locals.title = '通訊錄列表 — ' + res.locals.title

  const data = await getListData(req, res)
  if (data.redirect) {
    return res.redirect(data.redirect)
  }
  if (req.session.admin) {
    res.render('address-book/list', data)
  } else {
    res.render('address-book/list-no-admin', data)
  }
})

router.get('/api', async (req, res) => {
  const data = await getListData(req, res)
  res.json(data)
})

router.delete('/:sid', async (req, res) => {
  const sid = +req.params.sid || 0
  if (sid === 0) {
    return res.json({
      success: false,
      info: '無效的參數',
    })
  }

  const sql = `DELETE FROM address_book WHERE sid=?`
  const [result] = await db.query(sql, [sid])
  res.json(result)
  /*
  {
    "fieldCount": 0,
    "affectedRows": 1,
    "insertId": 0,
    "info": "",
    "serverStatus": 2,
    "warningStatus": 0,
    "changedRows": 0
}
  */
})

// 呈現新增資料的表單
router.get('/add', async (req, res) => {
  res.locals.pageName = 'ab_add'
  res.locals.title = '新增通訊錄 — ' + res.locals.title
  res.render('address-book/add')
})
router.post('/aaa', async (req, res) => {
  res.json({ a: 1 })
})
// const upload = multer({ dest: 'pibilc/' })
// 處理新增資料的表單

router.post('/add', upload.single('avatar'), async (req, res) => {
  const output = {
    success: false,
    postData: req.body,
    error: '',
    code: 0,
  }
  // console.log(req.body)
  // const upload = multer({ dest: 'pibilc/' })

  // // TODO: 資料格式檢查
  // router.post(
  //   '/upload2',
  //   upload.single('avatar'), // 上傳來的檔案(這是單個檔案，欄位名稱為avatar)
  //   async function (req, res, next) {
  //     // req.file 即上傳來的檔案(avatar這個檔案)
  //     // req.body 其它的文字欄位資料…
  //     console.log(req.file, req.body)

  //     if (req.file) {
  //       console.log(req.file)
  //       return res.json({ message: 'success', code: '200' })
  //     } else {
  //       console.log('沒有上傳檔案')
  //       return res.json({ message: 'fail', code: '409' })
  //     }
  //   }
  // )
  // const formSchema = z.object({
  //   name: z.string().min(2, { message: '名字長度要大於等於 2' }),
  //   email: z.string().email({ message: '請填寫正確的 email' }),
  //   mobile: z
  //     .string()
  //     .regex(/^09\d{2}-?\d{3}-?\d{3}$/, { message: '請填寫正確的手機號碼' }),
  // })

  // const parseResult = formSchema.safeParse(req.body)
  // if (!parseResult.success) {
  //   output.issues = parseResult.error.issues
  //   return res.json(output)
  // }

  const sql2 =
    'INSERT INTO `products` (`seller_id`,`category_id`,`product_photos`,`product_name`,`product_price`,`product_qty`,`product_status`,`product_intro`,`created_at`,`edit_at`,`status`) VALUES (?,?,?,?,?,?,?,?,NOW(),NOW(),1)'
  console.log(sql2)
  req.body.created_at = new Date() // 新增屬性 created_at (欄位名稱)

  console.log(req.file, req.body)

  let result
  try {
    const [result] = await db.query(sql2, [
      req.body.seller_id,
      req.body.category_id,
      req.file.filename,
      req.body.product_name,
      req.body.product_price,
      req.body.product_qty,
      req.body.product_status,
      req.body.product_intro,
      req.body.status,
    ])

    output.success = !!result.affectedRows
  } catch (ex) {
    output.error = ex.toString()
  }

  /*
{
    "fieldCount": 0,
    "affectedRows": 1, // 新增的列數
    "insertId": 1031,  // 此筆新增資料的 PK
    "info": "",
    "serverStatus": 2,
    "warningStatus": 0,
    "changedRows": 0
}
*/

  res.json(output)
})
// 要處理 multipart/form-data
router.post('/add/multi', upload.none(), async (req, res) => {
  res.json(req.body)
})

// // 修改資料的表單
// router.get('/edit/:sid', async (req, res) => {
//   const sid = +req.params.sid || 0
//   if (!sid) {
//     return res.redirect('/address-book')
//   }
//   const sql = `SELECT * FROM address_book WHERE sid=${sid}`
//   const [rows] = await db.query(sql)
//   if (!rows.length) {
//     return res.redirect('/address-book')
//   }
//   const r = rows[0]
//   const d = dayjs(r.birthday)
//   r.birthday = d.isValid() ? d.format('YYYY-MM-DD') : ''
//   res.render('address-book/edit', r)
// })

// router.put('/edit/:sid', async (req, res) => {
//   const output = {
//     success: false,
//     postData: req.body,
//     error: '',
//     code: 0,
//   }

//   let sid = +req.params.sid || 0

//   let birthday = dayjs(req.body.birthday, 'YYYY-MM-DD', true) // dayjs 物件
//   // 置換處理過的值
//   req.body.birthday = birthday.isValid() ? birthday.format('YYYY-MM-DD') : null

//   // TODO: 資料格式檢查

// const sql = 'UPDATE `address_book` SET ? WHERE sid=?'
// try {
//   // 執行 SQL 時最好做錯誤處理
//   const [result] = await db.query(sql, [req.body, sid])
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
//     output.success = !!(result.affectedRows && result.changedRows)
//   } catch (ex) {
//     output.error = ex.toString()
//   }
//   res.json(output)
// })

// router.get('/zod', (req, res) => {
//   const strSchema = z.string().min(4, { message: '請填寫長度四以上的字串' })

//   res.json({
//     result: strSchema.safeParse('12'),
//   })
// })

// 取得單筆資料的 API
// router.get('/:sid', async (req, res) => {
//   const sid = +req.params.sid || 0
//   if (!sid) {
//     return res.json({ success: false })
//   }
//   const sql = `SELECT * FROM address_book WHERE sid=${sid}`
//   const [rows] = await db.query(sql)
//   if (!rows.length) {
//     return res.json({ success: false })
//   }
//   const r = rows[0]
//   const d = dayjs(r.birthday)
//   r.birthday = d.isValid() ? d.format('YYYY-MM-DD') : ''

//   res.json({ success: true, data: r })
// })
export default router
