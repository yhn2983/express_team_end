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

  (1)

{4/2}

筆記:當使用者忘記密碼並希望重設密碼時，以下是整個流程：

1.使用者在前端輸入他們的電子郵件地址並提交。

2.伺服器收到請求後，會在 Otp 資料表中為該電子郵件地址生成一個一次性密碼 (OTP)。這個 OTP 會有一個到期時間。

3.伺服器會透過設定好的 SMTP 伺服器，將這個 OTP 透過電子郵件發送給使用者。

4.使用者在收到電子郵件後，會在重設密碼的表單中輸入他們的電子郵件、OTP 和新密碼，然後提交。

5.伺服器收到請求後，會檢查 OTP 是否存在且未過期。如果檢查通過，則會更新使用者的密碼，並從 Otp 資料表中刪除該 OTP。
------------------------------------------------
這就是整個忘記密碼並重設密碼的流程。這種方法的好處是，即使有人知道使用者的電子郵件地址，他們也無法在不知道 OTP 的情況下重設密碼。此外，由於 OTP 有到期時間，所以即使 OTP 被其他人獲取，他們也只有在一段有限的時間內才能使用它。

是的，你的理解是正確的。以下是整個流程的步驟：

使用者在前端表單中輸入他們的電子郵件地址，然後提交表單。

前端應用程式會呼叫 /otp API，並將電子郵件地址作為參數傳遞。這個 API 會生成一個 OTP，並將其發送到使用者的電子郵件地址。

使用者從他們的電子郵件中獲取 OTP，然後在前端表單中輸入他們的電子郵件地址、OTP 和新的密碼。

前端應用程式會呼叫 /reset API，並將電子郵件地址、OTP 和新的密碼作為參數傳遞。這個 API 會驗證 OTP，並更新使用者的密碼。

請注意，這個流程需要在 30 秒內完成，因為 OTP 在生成後的 30 秒內會過期。如果 OTP 過期，使用者將需要重新請求一個新的 OTP。
----------------------------------------------------------------------
上傳大頭貼功能筆記，因為用next的Image元件，他是以檔名來重新抓取資料，
所以建議的做法是，存完圖片後面加上dash亂數，就可以上傳圖片馬上更新會員資料的部分了



