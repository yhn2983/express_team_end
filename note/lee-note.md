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


{3/25}

1.增加前端驗證功能，記得要留紅色提醒的位置，不要讓表單忽大忽小

2.Scss注意事項，雖然next可以直接用scss.module，不過只限於html標籤<button><table><td>...
所以如果要自訂className的樣式，還是只能每一行都寫，
大概像 <div className={styles.error}>{error.email}</div>

{3/26~3/29}
1.註冊跟登入功能優化，完成一鍵填入，記得測試的時候要先把accessToken刪掉(登出)，不然會整個當機

2.實作profile頁面，有把預設資料都帶進去，更改資料的next+express也做完成並測試成功

3.要注意next context 的 checkAuth() 函式跟 express的 check api 使用時機!處理的資料不一樣!
例如更改資料表單要接收跟傳送的資料跟checkAuth()回傳的資料完全不一樣，所以要自己發api來處理!
          {   
            isAuth: true,
            userData: {
              id: user.id,
              email: user.email,
              nickname: user.nickname,
            },
          }

          { name, mobile: newMobile, address }


{3/31}

完成上傳圖片並更新在頁面中，要注意跟修改的點很多

1.上傳的路由，必須加上兩個middleware，包含multer(還要特別設定存放路徑跟新檔名)，
跟會員驗證authenticate，還要更新資料庫的圖片名稱對應新檔名，以便前端抓到圖片資料

2.next的設定也非常複雜，如果要把input type file自定義樣式，要把她設display:'none'，
還要用useRef創建參照，還要定義一個函數模擬點擊input元件。 fetchUserData() 包含後端來的資料
要非同步處理user狀態跟file狀態，處理的函式在使用useEffect包起來，組件掛載時取得資料。
檔案上傳記得掛 credentials: 'include' 帶上cookie外，請求體也要改成formData，
上傳完成後，在呼叫一次 fetchUserData() ，會觸發useEffect更動圖片


{4/1}

1.加一點樣式給profile

2.創建忘記密碼功能跟表單，並且完成功能

3.試試看google登入


{4/2}

1.準備做忘記密碼功能 筆記:當使用者忘記密碼並希望重設密碼時，以下是整個流程：

a.使用者在前端輸入他們的電子郵件地址並提交。

b.伺服器收到請求後，會在 Otp 資料表中為該電子郵件地址生成一個一次性密碼 (OTP)。這個 OTP 會有一個到期時間。

c.伺服器會透過設定好的 SMTP 伺服器，將這個 OTP 透過電子郵件發送給使用者。

d.使用者在收到電子郵件後，會在重設密碼的表單中輸入他們的電子郵件、OTP 和新密碼，然後提交。

e.伺服器收到請求後，會檢查 OTP 是否存在且未過期。如果檢查通過，則會更新使用者的密碼，並從 Otp 資料表中刪除該 OTP。

2.上傳大頭貼功能完善，因為用next的Image元件，他是以檔名來重新抓取資料，
所以建議的做法是，存完圖片後面加上dash亂數(uuid v4之類的)，就可以上傳圖片馬上更新會員資料的部分了


{4/3}

1.忘記密碼功能完成，注意多個檔案設定檔案有關連，創建忘記密碼跟重設密碼兩個表單，
跟暫時存otp的資料表，還有兩個api分作用為，

(1)客戶端輸入email，後台建立otp資料，並傳送驗證碼到使用者信箱
(2)客戶端輸入第二個表單，輸入驗證碼、email、密碼、確認密碼來更改密碼，
成功後會跳轉到登入頁面，輸入新密碼就可以完成登入了


