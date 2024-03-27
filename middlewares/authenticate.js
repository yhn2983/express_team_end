import jsonwebtoken from 'jsonwebtoken'

// 存取`.env`設定檔案使用
import 'dotenv/config.js'

// 獲得加密用字串
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET

// 中介軟體middleware，用於檢查授權(authenticate)
export default function authenticate(req, res, next) {
  const token = req.cookies.accessToken

  // 如果 token 存在
  if (token) {
    // verify的callback會帶有decoded payload(解密後的有效資料)，就是user的資料
    jsonwebtoken.verify(token, accessTokenSecret, (err, user) => {
      if (err) {
        // 如果 token 驗證失敗，返回錯誤訊息
        return res.json({
          status: 'error',
          message: '不合法的存取令牌',
        })
      }

      // 如果 token 驗證成功，將用戶資訊加到 req 中並繼續處理請求
      req.user = user
      next()
    })
  } else {
    // 如果 token 不存在，返回錯誤訊息
    return res.json({
      status: 'error',
      message: '授權失敗，沒有存取令牌',
    })
  }
}
