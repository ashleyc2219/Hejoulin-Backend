const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../modules/connect-db");
const upload = require("./../modules/upload-images");
const jwt = require("jsonwebtoken");

const router = express.Router();

// 檢查登入帳密
router.post("/login", upload.none(), async (req, res) => {
  const output = {
    success: false,
    error: "",
    info: null,
    token: "",
    code: 0
  };
  console.log(req.body);
  const [rs] = await db.query("SELECT * FROM user WHERE user_account=?", [req.body.user_account]);
  if (!rs.length) {
    output.error = "帳號或是密碼輸入錯誤";
    output.code = 401;
    return res.json(output);
  }
  console.log(rs);

  const row = rs[0];
  const compareResult = await bcrypt.compare(req.body.user_pass, row.user_pass);
  if (!compareResult) {
    output.error = "帳號或是密碼輸入錯誤";
    output.code = 402;
    return res.json(output);
  }
  const userAccount = row.user_account
  output.success = true;
  output.info = userAccount;
  // console.log('userAccount',userAccount);
  output.token = jwt.sign({ userAccount }, process.env.JWT_KEY);

  res.json(output);
});

// 註冊
router.post("/register", upload.none(), async (req, res) => {
  const output = {
    success: false,
    // postData: req.body,
    info: null,
    token: "",
    uId: "",
    error: ""
  };

  const hash = await bcrypt.hash(req.body.user_pass, 10);
  const userAccount = req.body.user_account;
  console.log(userAccount);
  const sql = "INSERT INTO `user`(`user_account`, `user_pass`, `user_time`) " +
    "VALUES ( ?, ?,NOW());";
  const getIdSql = "SELECT `user_id` FROM `user` WHERE `user_account`=?";
  const insertMemberData = "INSERT INTO `member`(`member_id`, `user_id`)" +
    " VALUES ( ?, ?);";
  let result;

  try {
    [result] = await db.query(sql, [
      userAccount,
      hash
    ]);
    const [rs1] = await db.query(getIdSql, [userAccount]);
    const userId = rs1[0].user_id;
    const [rs2] = await db.query(insertMemberData, [userId, userId]);
    console.log(rs2);
    if (result.affectedRows === 1 && rs2.affectedRows === 1) {
      output.success = true;
      output.token = jwt.sign({ userAccount }, process.env.JWT_KEY);
      output.info = { userAccount };
      output.uId = { userId };

    } else {
      output.error = "無法新增會員";
    }
  } catch (ex) {
    console.log(ex);
    output.error = "used";
  }

  res.json(output);
});

// 確認打過來的帳號是否存在
router.post("/account-check", upload.none(), async (req, res) => {
  const output = {
    used: "",
    uId: "",
    token: "",
    userAccount: "",
  };
  const userAccount = req.body.user_account;
  const sql = "SELECT `user_account`, `user_id` FROM user WHERE `user_account`=?";
  const [rs] = await db.query(sql, [userAccount || "aa"]);
  if (rs.length) {
    output.used = "have";
    output.uId = rs[0].user_id;
    output.token = jwt.sign({ userAccount }, process.env.JWT_KEY);
    output.userAccount = userAccount;
  } else {
    output.used = "noAccount";
  }

  res.json(output);
});

// 產生六位數驗證碼
function getVerifyCode(e) {
  e = e || 6;
  let t = "0123456789", a = t.length, n = "";
  for (let i = 0; i < e; i++) n += t.charAt(Math.floor(Math.random() * a));
  return n;
}

// 寄email從打過來的郵件位址
router.post("/send-email", upload.none(), async (req, res) => {
  let uId = req.body.userId;
  // 新增id進去產生驗證碼
  const createVCode = "INSERT INTO `verify`(`verify_code`,`user_id`) VALUES (?, ?)";
  const [insertVCode] = await db.query(createVCode, [getVerifyCode(6), uId]);
  console.log(uId);
  // 拿到驗證碼寄出
  if (insertVCode.affectedRows === 1) {
    const sql = "SELECT `verify_code` FROM verify WHERE user_id=?";
    const [rs] = await db.query(sql, [uId]);
    const verifyCode = rs[0].verify_code;
    const to = req.body.userAccount;
    // 引用 nodemailer
    const nodemailer = require("nodemailer");

    // 宣告發信物件
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: "hejoulin04@gmail.com",
        pass: "LetHejoulin04LogIn",
      }
    }); 

    const options = {
      // 寄件者
      from: "hejoulin04@gmail.com",
      // 收件者
      to: to,
      // 副本
      cc: "hejoulin04@gmail.com",
      // 密件副本
      bcc: "hejoulin04@gmail.com",
      // 主旨
      subject: "禾酒林 : 密碼驗證信", // Subject line
      // 純文字
      text: "禾酒林 : 密碼驗證信", // plaintext body
      // 嵌入 html 的內文
      html: `
          <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
    <style>
    .mail-container {
      max-width: 350px;
      height: fit-content;
      box-shadow: 0px 0px 15px #9d9d9d6e;
      margin: auto;
      border-radius: 10px;
      display: flex;
      align-items: center;
      flex-direction: column;
      padding: 40px;
    }
    img {
      width: 100%;
      margin-top: 10px;
      filter: drop-shadow(0 2px 1px rgba(128, 128, 128, 0.509));
    }

    .info {
      width: 100%;
      margin-top: 30px;
      font-size: 14px;
      color: #6c6c6c;
      text-align: center;
      border-bottom: 1px solid rgba(128, 128, 128, 0.267);
      padding-bottom: 15px;
    }

    .verifycode {
      width: 100%;
      text-align: center;
      margin-top: 20px;
      font-size: 40px;
      color: white;
      background-color: #3D4349;
      padding: 5px 20px;
      border-radius: 5px;
    }
    </style>
  </head>
          <body>
    <div class="mail-container">
      <img src="https://i.imgur.com/kDJRSpK.png" alt="" />
      <div class="info">
        歡迎成為禾酒林會員，以下是您的驗證碼。<br />
        輸入完驗證碼即可完成註冊流程
      </div>
      <div class="verifycode">` + verifyCode.slice(0, 3) + `-` + verifyCode.slice(3, 6) + `</div>
                   </div>
                   </body>
          `
    };

    // 發送信件方法
    await transporter.sendMail(options, function(error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("訊息發送: " + info.response);
        res.status(200).send({ message: "success", message_id: info.messageId });
      }
    });
  }

});

// 查驗驗證碼是否相符
router.post("/code/verify/passForget", upload.none(), async (req, res) => {
  const uId = req.body.pData.userId;
  const sql = "SELECT `verify_code` FROM verify WHERE user_id=?";
  const [rs] = await db.query(sql, [uId]);
  const enterCode = req.body.vData.verifyCodeFirst + req.body.vData.verifyCodeLast;
  // console.log(rs);
  // console.log(enterCode);
  if (rs[0].verify_code === enterCode) {
    const clearVCode = "DELETE FROM `verify` WHERE `user_id`=?"
    const [verifyCodeCycle] = await db.execute(clearVCode, [uId])
    // console.log(verifyCodeCycle);
    if (verifyCodeCycle.affectedRows >= 1) {
    res.status(200).send({ message: "success" });
    }
  } else {
    res.status(200).send({message:"codeError"});
  }

});
router.post("/code/verify/register", upload.none(), async (req, res) => {
  const uId = req.body.id.user_id;
  // console.log(uId);
  const sql = "SELECT `verify_code` FROM verify WHERE user_id=?";
  const [rs] = await db.query(sql, [uId]);
  const enterCode = req.body.vData.verifyCodeFirst + req.body.vData.verifyCodeLast;
  // console.log(rs);
  // console.log(enterCode);
  if (rs[0].verify_code === enterCode) {
    const clearVCode = "DELETE FROM `verify` WHERE `user_id`=?"
    const [verifyCodeCycle] = await db.execute(clearVCode, [uId])
    // console.log(verifyCodeCycle);
    if (verifyCodeCycle.affectedRows >= 1) {
    res.status(200).send({ message: "success" });
    }
  } else {
    res.status(200).send({message:"codeError"});
  }

});

router.post('/getId', async (req,res)=>{
  const userAccount = req.body.userAccount;
  console.log(userAccount);
  const sql = "SELECT user_id FROM user WHERE user_account = ?"
  const [rs] = await db.query(sql, [userAccount])

  res.json(rs)
})


module.exports = router;