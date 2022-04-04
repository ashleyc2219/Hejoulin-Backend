var express = require("express");
var router = express.Router();
const db = require("../modules/connect-db");
const upload = require("./../modules/upload-images");

let verifyCode = "";
// 寄email從打過來的郵件位址
router.post("/send-email", upload.none(), async (req, res) => {
  const to = req.body.email_account;
  const cardNum = req.body.cardNum;
  const total = req.body.total
  console.log(to)
  verifyCode = Math.floor(Math.random() * 1000000).toString();
  // 引用 nodemailer
  const nodemailer = require("nodemailer");

  // 宣告發信物件
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: "hejoulin04@gmail.com",
      pass: "LetHejoulin04LogIn",
    },
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
    subject: "刷卡 驗證信", // Subject line
    // 純文字
    text: "刷卡 驗證信", // plaintext body
    // 嵌入 html 的內文
    html: `<h2>驗證碼</h2> <p> ${verifyCode} </p> <p>卡號末四碼${cardNum}消費金額$${total}元，驗證碼於6分鐘內有效。</p>`,
  };

  // 發送信件方法
  await transporter.sendMail(options, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("訊息發送: " + info.response + to);
      res.status(200).send({ message: "success", message_id: info.messageId });
    }
  });
});

// 查驗驗證碼是否相符
router.post("/code-verify", upload.none(), async (req, res) => {
  
  const enterCode = req.body.enterCode;
  if (verifyCode === enterCode) {
    res.status(200).send({ result: "success" });
  }else{
      res.status(200).send({ result: "fail" });
  }
});

module.exports = router;
