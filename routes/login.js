const express = require('express');
const bcrypt = require('bcryptjs');
const db = require("../modules/connect-db");
const upload = require('./../modules/upload-images');
const jwt = require("jsonwebtoken");

const router = express.Router();

//登入
router.get('/login', async (req, res) => {
    res.render('login');
})
// 檢查登入帳密
router.post('/login', upload.none(), async (req, res) => {
    const output = {
        success: false,
        error: '',
        info: null,
        token: '',
        code: 0,
    };

    const [rs] = await db.query('SELECT * FROM user WHERE user_account=?', [req.body.user_account]);
    if (!rs.length) {
        output.error = '帳號或是密碼輸入錯誤';
        output.code = 401;
        return res.json(output);
    }
    const row = rs[0];

    const compareResult = await bcrypt.compare(req.body.user_pass, row.user_pass);
    if (!compareResult) {
        output.error = '帳號或是密碼輸入錯誤';
        output.code = 402;
        return res.json(output);
    }
    const {user_account} = row;
    output.success = true;
    output.info = {user_account};

    output.token = jwt.sign({user_account}, process.env.JWT_KEY)

    res.json(output);
})

//註冊
router.post('/register', async (req, res) => {
    const output = {
        success: false,
        postData: req.body,
        error: '',
    }
    //TODO:欄位檢查

    const hash = await bcrypt.hash(req.body.user_pass, 10);

    const sql = "INSERT INTO `user`(`user_account`, `user_pass`, `user_time`) " +
        "VALUES ( ?, ?,NOW());";

    let result;
    try {
        [result] = await db.query(sql, [
            req.body.user_account,
            hash,
        ]);
        if (result.affectedRows === 1) {
            output.success = true;
        } else {
            output.error = '無法新增會員';
        }
    } catch (ex) {
        console.log(ex);
        output.error = 'Email 已被使用過';
    }
    res.json(output);
});
router.post('/account-check', async (req, res) => {

    const sql = "SELECT `user_account` FROM user WHERE `user_account`=?";
    const [rs] = await db.query(sql, [req.body.user_account || 'aa']);

    res.json({used: !!rs.length});
});
router.post('/send-email', upload.none(),async (req, res) => {

    const sql = "SELECT `verify_code` FROM verify";
    const [rs] = await db.query(sql);
    console.log(rs[0]);
    const verifyCode = rs[0].verify_code;
    const to = req.body.user_account;
    console.log(to);
    // 引用 nodemailer
    const nodemailer = require('nodemailer');

    // 宣告發信物件
    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: 'cweihao2956@gmail.com',
            pass: 'a128440816'
        }
    });

    const options = {
        // 寄件者
        from: 'cweihao2956@gmail.com',
        // 收件者
        to: to,
        // 副本
        cc: 'cweihao2956@gmail.com',
        // 密件副本
        bcc: 'cweihao2956@gmail.com',
        // 主旨
        subject: '禾酒林 : 密碼驗證信', // Subject line
        // 純文字
        text: '禾酒林 : 密碼驗證信', // plaintext body
        // 嵌入 html 的內文
        html: `<h2>驗證碼</h2> <p>` + verifyCode + `</p>`,
        // 附件檔案
        attachments: [ {
            filename: '4-2.png',
            path: 'public/images/member_mark_pic/4-2.png'
        }, {
            filename: 'text01.txt',
            content: '聯候家上去工的調她者壓工，我笑它外有現，血有到同，民由快的重觀在保導然安作但。護見中城備長結現給都看面家銷先然非會生東一無中；內他的下來最書的從人聲觀說的用去生我，生節他活古視心放十壓心急我我們朋吃，毒素一要溫市歷很爾的房用聽調就層樹院少了紀苦客查標地主務所轉，職計急印形。團著先參那害沒造下至算活現興質美是為使！色社影；得良灣......克卻人過朋天點招？不族落過空出著樣家男，去細大如心發有出離問歡馬找事'
        }]
    };

    // 發送信件方法
    await transporter.sendMail(options, function(error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('訊息發送: ' + info.response);
            res.status(200).send({ message:"郵件已寄出", message_id: info.messageId })
        }
    });
});


module.exports = router;