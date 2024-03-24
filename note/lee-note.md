{3/23}

1.更新Member模組並成功抓取資料
模組的資料更新時間記得要改false關掉，不然即使沒更新的時間欄位也會亂跑
如果要created_at在手動增加就好

2.測試資料庫資料跟登入的方法Postman 
改POST訪問然後輸入http://localhost:3001/api/auth/login
下面選body->raw輸入
{
  "nickname": "我是使用者",
  "password": "123456"
}
送出會取得token
然後再用GET輸入http://localhost:3001/api/auth/check
Headers加(key Authorization )(value Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmlja25hbWUiOiLmiJHmmK_kvb_nlKjogIUiLCJpYXQiOjE3MTExMzYyMTEsImV4cCI6MTcxMTM5NTQxMX0.1tjBlsUAMboLfE3X6b38CTz9D2CETpnqeU7AyUxz9vI)
就可以得到驗證過後的資料了

{3/24}
1.完成前端登入登出表單的功能
輸入email跟password就會發送JSON給後端，後端去資料庫中找資料，
成功登入後會直接把登入狀態存在localStorage，也加了可以清除的方法
因為直接清除localStorage比較簡單，所以在前端做完沒發api到express

2.完成註冊功能api跟react表單
註冊功能流程，前端發送JSON，後端接收請求跟資料庫交互，回傳狀態給前端，前端跳轉登入頁面
密碼問題，因為常常Member模組再生成時就會加密一次了，故後端加進去時不需要再用了

3.把圖片同步到本機next的imgs裡面了，記得不要上傳到github!!!加上 /public/imgs

4.試著把樣式寫上去
