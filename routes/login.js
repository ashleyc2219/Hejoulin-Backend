const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('./../modules/connect_mysql');
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
router.get('/register', (req, res) => {
    res.locals.pageName = 'register';
    res.render('register');
});
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
router.get('/account-check', async (req, res) => {
    const sql = "SELECT `user_account` FROM user WHERE `user_account`=?";
    const [rs] = await db.query(sql, [req.query.user_account || 'aa']);

    res.json({used: !!rs.length});

});

//登出
router.get('/logout', (req, res) => {
    delete req.localStorage.token;
    res.redirect('/');
});

module.exports = router;