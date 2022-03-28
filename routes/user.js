const express = require('express');
const db = require("../modules/connect-db");
const upload = require('./../modules/upload-images');
const bcrypt = require("bcryptjs");
const moment = require("moment-timezone");
const { jwtVerify } = require('../modules/jwtVerify')

const router = express.Router();

async function getListData(req, res) {
    const perPage = 5;//一頁幾筆
    //用戶要看第幾頁
    let page = req.query.page ? parseInt(req.query.page) : 1;
    if (page < 1) {
        return res.redirect('/user/list');
    }//頁數合理規則
    const conditions = {}; //傳到 ejs 的條件
    let search = req.query.search ? req.query.search.trim() : '';//trim去掉頭尾空白
    let sqlWhere = ' WHERE 1 ';
    if (search) {
        sqlWhere += ` AND \`user_id\` LIKE ${db.escape('%' + search + '%')} `;
        conditions.search = search;
    }
    //輸出
    const
        output = {
            //success: false,
            perPage,
            page,
            totalRows: 0,
            totalPages: 0,
            rows: [],
            conditions
        };

    const t_sql = `SELECT COUNT(1) num
                   FROM user ${sqlWhere}`;
    const [rs1] = await db.query(t_sql);
    const totalRows = rs1[0].num;
    //let totalPages = 0;
    if (totalRows) {
        output.totalPages = Math.ceil(totalRows / perPage);
        output.totalRows = totalRows;
        if (page > output.totalPages) {
            //到最後一頁
            return res.redirect(`/user/list?page=${output.totalPages}`);
        }

        const sql = `SELECT \`member_id\`,
                            \`user_account\`,
                            \`user_time\`,
                            \`user_pass\`,
                            \`member_name\`,
                            \`member_bir\`,
                            \`member_mob\`,
                            \`member_addr\`
                     FROM \`user\`
                              INNER JOIN \`member\` ON \`user\`.\`user_id\` = \`member\`.\`user_id\`
                     ORDER BY \`member_id\` DESC LIMIT ${perPage *
                     (page - 1)}, ${perPage}`;
        const [rs2] = await db.query(sql);
        //拿到資料在這邊先做格式轉換
        rs2.forEach(el => {
            let str = res.locals.toDateString(el.member_bir);
            if (str === 'Invalid date') {
                el.member_bir = '沒有輸入資料';
            } else {
                el.member_bir = str;
            }
        })
        rs2.forEach(el => el.member_bir = res.locals.toDateString(el.member_bir));
        output.rows = rs2;
    }
    return output;
}

router.get('/api/list', async (req, res) => {
    res.json(await getListData(req, res));
});
// 登入後拿到帳號
router.get('/api/auth-list', async (req, res) => {
    if (res.locals.auth && res.locals.auth.user_account) {
        return res.json({
            ...await getListData(req, res),
            user_account: res.locals.auth.user_account,
            member_id: res.locals.auth.member_id,
        }); // 正常送出資料
    } else {
        res.json({success: false, error: '沒有授權'})
    }
});

// 帶會員id拿到單筆會員資料
router.post('/member', jwtVerify,async (req, res) => {
    const userAccount = res.locals.auth
    const [rs] = await db.query(`SELECT \`member_id\`,
                                        \`user_account\`,
                                        \`user_pass\`,
                                        \`member_name\`,
                                        \`member_bir\`,
                                        \`member_mob\`,
                                        \`member_addr\`
                                 FROM \`user\`
                                          INNER JOIN \`member\` ON \`user\`.\`user_id\` = \`member\`.\`user_id\`
                                 WHERE member_id = ${userAccount['member_id']} `)
    res.json(rs)
});
// 改大頭貼
router.put('/member', upload.single('avatar'), async (req, res) => {
    let modifyAvatar = '';
    const userAccount = req.locals.auth;
    if (req.file && req.file.filename) {
        modifyAvatar = ` , avatar='${req.file.filename}'`;
    }
    const sql = `UPDATE user
                 SET user_account=? ${modifyAvatar}
                 WHERE member_id=${userAccount['member_id']}`;
    await db.query(sql);
});
// 改密碼
router.put('/member-passChange', upload.none, async (req, res) => {
    let user_account = '';
    const userAccount = req.locals.auth;
    if (req.file && req.file.filename) {
      user_account = ` , avatar='${req.file.filename}'`
    }
    const sql = `UPDATE user
                 SET user_pass=? ${user_account}
                 WHERE user_account=${userAccount['user_account']}`;
    await db.query(sql);
});

// 帶會員id拿取酒標作品資料
router.post('/member/MemberMark', jwtVerify, async (req, res) => {
    const userAccount = res.locals.auth;
    const [rs] = await db.query(`SELECT pics FROM mark WHERE member_id = ${userAccount['member_id']}`);
    res.json(rs);
})

// 帶會員id拿取收藏商品資料
router.post('/member/MemberFav', jwtVerify, async (req, res) => {
    const userAccount = res.locals.auth;
    const [rs] = await db.query(`SELECT \`member_id\`, \`pro_price\`, \`pro_mark\`, \`pro_name\`, \`pro_img\`
                                 FROM \`product_sake\`
                                          INNER JOIN \`favorite\`
                                                     ON \`favorite\`.\`pro_id\` = \`product_sake\`.\`pro_id\`
                                          INNER JOIN \`product_format\`
                                                     ON \`product_format\`.\`format_id\` = \`product_sake\`.\`format_id\`
                                 WHERE \`member_id\` = ${userAccount['member_id']}`);
    res.json(rs);
})
// 帶會員id修改收藏
// 帶會員id拿取訂閱清單資料
router.post('/member/MemberSublist', jwtVerify, async (req, res) => {
    const userAccount = res.locals.auth;
    const [rs] = await db.query(`SELECT order_main.\`member_id\`,\`sub_time\`,\`order_sub_d\`.\`order_state\`,\`order_sub_d\`.\`subtime_id\`,\`order_sub_d\`.\`order_d_id\`
                                  FROM \`order_sub_d\`
                                           INNER JOIN \`order_main\`
                                                      ON \`order_main\`.\`order_id\` = \`order_sub_d\`.\`order_id\`
                                           INNER JOIN \`sub_time\`
                                                      ON \`sub_time\`.\`subtime_id\` = \`order_sub_d\`.\`subtime_id\`
                                  WHERE \`order_main\`.\`member_id\` = ${userAccount['member_id']}`);

    const [rs2] = await db.query(`SELECT \`sub_plan\`, \`sub_price\`, \`member_id\`
                                   FROM \`order_sub_d\`
                                            INNER JOIN \`order_main\`
                                                       ON \`order_main\`.\`order_id\` = \`order_sub_d\`.\`order_id\`
                                            INNER JOIN \`sub_plan\` ON \`sub_plan\`.\`sub_id\` = \`order_sub_d\`.\`sub_id\`
                                   WHERE \`order_main\`.\`member_id\` = ${userAccount['member_id']}`);
    const [rs3] = await db.query(`SELECT \`card_num\`, \`member_id\`
                                   FROM \`payment_detail\`
                                            INNER JOIN \`order_main\`
                                                       ON \`order_main\`.\`order_id\` = \`payment_detail\`.\`order_id\`
                                   WHERE \`member_id\` = ${userAccount['member_id']}`);

    const output = {
        data1: rs[0],
        data2: rs2[0],
        data3: rs3[0],
    };
    res.json(output);
});

// 帶會員id拿取訂單總覽資料
router.post('/member/MemberOrderList', jwtVerify,async (req, res) => {
    const userAccount = res.locals.auth
    const fm = ('YYYY-MM-DD')
    const sql = `SELECT \`order_state\`, \`order_d_price\`, \`order_date\`, \`member_id\`, \`order_main\`.\`order_id\`
                 FROM \`order_main\`
                          INNER JOIN \`order_sake_d\` ON \`order_sake_d\`.\`order_id\` = \`order_main\`.\`order_id\`
                 WHERE \`member_id\` = ${userAccount['member_id']}`;
    const [rs] = await db.query(sql);
    const rs2 = rs.map((v) => ({...v, order_date: moment(v.order_date).format(fm)}));
    res.json(rs2);
});

// 帶會員id拿取活動記錄資料
router.post('/member/MemberEventList', jwtVerify, async (req, res) => {
    const userAccount = res.locals.auth;
    const fm = ('YYYY-MM-DD');
    const sql = ` SELECT \`order_d_id\`,\`order_name\`,\`order_mobile\`,\`order_email\`,\`order_state\`,\`event_location\`,\`event_name\`,\`event_time_start\`, \`order_event_d\`.\`order_id\`,\`order_d_price\`,\`order_date\`,\`member_id\`
                 FROM \`order_main\` 
                     INNER JOIN \`order_event_d\` ON \`order_main\`.\`order_id\` = \`order_event_d\`.\`order_id\` 
                     INNER JOIN \`event\` ON \`event\`.\`event_id\` = \`order_event_d\`.\`event_id\` 
                 WHERE \`member_id\` = ${userAccount['member_id']} `;
    const [rs] = await db.query(sql);
    const rs2 = rs.map((v) => ({...v, event_time_start: moment(v.event_time_start).format(fm)}));
    res.json(rs2);
});

// 修改會員資料
router.route('/edit/:user_id')
    .get(async (req, res) => {
        const sql = `SELECT \`member_id\`,
                            \`user_account\`,
                            \`user_time\`,
                            \`user_pass\`,
                            \`member_name\`,
                            \`member_bir\`,
                            \`member_mob\`,
                            \`member_addr\`
                     FROM \`user\`
                              INNER JOIN \`member\` ON \`user\`.\`user_id\` = \`member\`.\`user_id\` `;
        const [rs] = await db.query(sql);

        if (rs.length) {
            res.render('user/edit', {row: rs[0]});
        } else {
            res.redirect('/user/list');
        }
    })
    .post(async (req, res) => {
        // TODO: 欄位檢查
        const output = {
            success: false,
            postData: req.body,
        }
        const hash = await bcrypt.hash(req.body.user_pass, 10);
        const input = {...req.body};
        const sql = `UPDATE \`user\` u INNER JOIN \`member\` m
                     ON u.user_id = m.user_id
                         SET u.user_pass=?, m.member_name=?, m.member_bir=?, m.member_mob=?, m.member_addr=?
                     WHERE u.user_id=? AND m.user_id=?`
        let result = {};
        // 處理修改資料時可能的錯誤
        try {
            [result] = await db.query(sql, [
                hash,
                req.body.member_name,
                req.body.member_bir,
                req.body.member_mob,
                req.body.member_addr,
                req.params.user_id,
                req.params.user_id,
            ]);
        } catch (ex) {
            output.error = ex.toString();
        }
        output.result = result;
        if (result.affectedRows === 2) {
            if (result.changedRows === 2) {
                output.success = true;
            } else {
                output.error = '資料沒有變更';

            }
        }

        res.json(output);
    })

module.exports = router;
