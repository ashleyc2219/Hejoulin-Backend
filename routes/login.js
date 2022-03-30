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

  const [rs] = await db.query("SELECT * FROM user WHERE user_account=?", [req.body.user_account]);
  if (!rs.length) {
    output.error = "帳號或是密碼輸入錯誤";
    output.code = 401;
    return res.json(output);
  }
  const row = rs[0];

  const compareResult = await bcrypt.compare(req.body.user_pass, row.user_pass);
  if (!compareResult) {
    output.error = "帳號或是密碼輸入錯誤";
    output.code = 402;
    return res.json(output);
  }
  const { user_account } = row;
  output.success = true;
  output.info = { user_account };

  output.token = jwt.sign({ user_account }, process.env.JWT_KEY);

  res.json(output);
});

// 註冊
router.post("/register", async (req, res) => {
  const output = {
    success: false,
    postData: req.body,
    error: ""
  };
  //TODO:欄位檢查

  const hash = await bcrypt.hash(req.body.user_pass, 10);

  const sql = "INSERT INTO `user`(`user_account`, `user_pass`, `user_time`) " +
    "VALUES ( ?, ?,NOW());";

  let result;

  try {
    [result] = await db.query(sql, [
      req.body.user_account,
      hash
    ]);
    if (result.affectedRows === 1) {
      output.success = true;

    } else {
      output.error = "無法新增會員";
    }
  } catch (ex) {
    console.log(ex);
    output.error = "Email 已被使用過";
  }

  res.json(output);
});

// 確認打過來的帳號是否存在
router.post("/account-check", async (req, res) => {

  const sql = "SELECT `user_account` FROM user WHERE `user_account`=?";
  const [rs] = await db.query(sql, [req.body.user_account || "aa"]);
  if (rs.length) {
    res.json({ used: "have" });
  } else {
    res.json({ used: "noAccount" });
  }


});

// 寄email從打過來的郵件位址
router.post("/send-email", upload.none(), async (req, res) => {

  const sql = "SELECT `verify_code` FROM verify";
  const [rs] = await db.query(sql);
  const verifyCode = rs[0].verify_code;
  const to = req.body.user_account;
  // 引用 nodemailer
  const nodemailer = require("nodemailer");

  // 宣告發信物件
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: "cweihao2956@gmail.com",
      pass: "a128440816"
    }
  });

  const options = {
    // 寄件者
    from: "cweihao2956@gmail.com",
    // 收件者
    to: to,
    // 副本
    cc: "cweihao2956@gmail.com",
    // 密件副本
    bcc: "cweihao2956@gmail.com",
    // 主旨
    subject: "禾酒林 : 密碼驗證信", // Subject line
    // 純文字
    text: "禾酒林 : 密碼驗證信", // plaintext body
    // 嵌入 html 的內文
    html: `<h2>驗證碼</h2> <p>` + verifyCode.slice(0, 3) + `-` + verifyCode.slice(3, 6) + `</p>`
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
});

// 查驗驗證碼是否相符
router.post("/code-verify", upload.none(), async (req, res) => {

  const sql = "SELECT `verify_code` FROM verify";
  const [rs] = await db.query(sql);
  const enterCode = req.body.verifyCodeFirst + req.body.verifyCodeLast;
  if (rs[0].verify_code === enterCode) {
    res.status(200).send({ message: "success" });
  }

});


module.exports = router;