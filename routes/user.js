const express = require("express");
const db = require("../modules/connect-db");
const upload = require("./../modules/upload-images");
const bcrypt = require("bcryptjs");
const moment = require("moment-timezone");
const { jwtVerify } = require("../modules/jwtVerify");
const jwt = require("jsonwebtoken");

const router = express.Router();

async function getPage(req, res) {
  const perPage = 6;//一頁幾筆
  //用戶要看第幾頁
  let page = req.query.page ? parseInt(req.query.page) : 1;
  let sqlWhere = " WHERE 1 ";
  //輸出
  const
    output = {
      //success: false,
      perPage,
      page,
      totalRows: 0,
      totalPages: 0,
      rows: []
    };

  const t_sql = `SELECT COUNT(1) num
                 FROM user ${sqlWhere}`;
  const [rs1] = await db.query(t_sql);
  const totalRows = rs1[0].num;
  //let totalPages = 0;
  if (totalRows) {
    output.totalPages = Math.ceil(totalRows / perPage);
    output.totalRows = totalRows;

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
                 ORDER BY \`member_id\` DESC LIMIT ${perPage * (page - 1)}, ${perPage}`;
    const [rs2] = await db.query(sql);
    //拿到資料在這邊先做格式轉換
    rs2.forEach(el => {
      let str = res.locals.toDateString(el.member_bir);
      if (str === "Invalid date") {
        el.member_bir = "沒有輸入資料";
      } else {
        el.member_bir = str;
      }
    });
    rs2.forEach(el => el.member_bir = res.locals.toDateString(el.member_bir));
    output.rows = rs2;
  }
  return output;
}


// 帶token進來 回傳member_id
router.post("/memberId", async (req, res) => {
  const token = req.body.token;
  jwt.verify(token, process.env.JWT_KEY, async (err, member) => {
    if (err) {
      res.send({ message: "can not verify token" });
    } else {
      let memberInfo = await db.query(
        `SELECT a1.user_id, a1.user_account, a2.member_id
            FROM user AS a1, member AS a2
             WHERE a1.user_id = a2.user_id AND a1.user_account = ?`,
        [member.userAccount]
      );
      res.json(memberInfo[0]);
    }
  });
});

// 帶會員id拿到單筆會員資料
router.post("/member", jwtVerify, async (req, res) => {

  const memberId = res.locals.auth[0].member_id;
  console.log();
  const sql = "SELECT \`member_id\`,\`user_account\`,\`user_pass\`,\`member_name\`,\`member_bir\`,\`member_mob\`,\`member_addr\`FROM \`user\` INNER JOIN \`member\` ON \`user\`.\`user_id\` = \`member\`.\`user_id\` WHERE member_id =? ";
  const [rs] = await db.query(sql, [memberId]);
  res.json(rs);

});

// 忘記密碼 - 改密碼
router.put("/member/forgetPassChange", upload.none(), async (req, res) => {
  const output = {
    success: false,
    postData: req.body,
    error: ""
  };

  const userPass = req.body.user_pass;
  const userAccount = req.body.email;
  console.log(userPass);
  console.log(userAccount);
  if (req.body && userPass) {
    // user_pass = ` , user_pass='${req.body.user_pass}'`;
  }

  const sql = `UPDATE user
               SET user_pass=?
               WHERE user_account = ?`;

  const hash = await bcrypt.hash(userPass, 10);

  try {
    [result] = await db.query(sql, [hash, userAccount]);
    console.log(result);
    if (result.affectedRows === 1) {
      output.success = true;

    } else {
      output.error = "設定密碼失敗";
    }
  } catch (ex) {
    console.log(ex);
    output.error = "建議您檢查是否輸入舊密碼";

  }

  res.json(output);

});

// 會員中心檢查舊密碼是否正確
router.post("/pass/check", jwtVerify, async (req, res) => {

  console.log(req.body.user_passOld);
  const userAccount = res.locals.auth[0].user_account;
  const sql = "SELECT `user_pass` FROM user WHERE `user_account`=?";
  const [rs] = await db.query(sql, [userAccount || "aa"]);
  const userOldPass = req.body.user_passOld;
  console.log(userOldPass);
  const needVerify = rs[0].user_pass;
  const compareBcrypt = await bcrypt.compare(userOldPass, needVerify);
  console.log(compareBcrypt);
  if (compareBcrypt) {
    res.json({ used: "have" });
  } else {
    res.json({ used: "舊密碼輸入錯誤" });
  }

});

// 會員中心更改密碼
router.put("/member/passChange", jwtVerify, async (req, res) => {
  const output = {
    success: false,
    postData: req.body,
    error: ""
  };

  console.log(res.locals.auth[0]);
  console.log(req.body);
  const userPass = req.body.user_pass;
  const userAccount = res.locals.auth[0].user_account;

  const hash = await bcrypt.hash(userPass, 10);

  const sql = `UPDATE user
               SET user_pass=?
               WHERE user_account = ?`;

  try {
    [result] = await db.query(sql, [hash, userAccount]);
    console.log(result);
    if (result.affectedRows === 1) {
      output.success = true;

    } else {
      output.error = "設定密碼失敗";
    }
  } catch (ex) {
    console.log(ex);
    output.error = "建議您檢查是否輸入新密碼";

  }

  res.json(output);

});

// 會員中心更改會員資料
router.put("/member/Change", jwtVerify, async (req, res) => {
  const output = {
    success: false,
    postData: req.body,
    error: ""
  };

  const memberName = req.body.member_name;
  const memberMob = req.body.member_mob;
  const memberId = res.locals.auth[0].member_id;
  const memberBir = req.body.birY + "-" + req.body.birM + "-" + req.body.birD;
  const sql = "UPDATE member SET member_name=?, member_mob=?, member_bir=? WHERE member_id = ?";

  try {
    [result] = await db.query(sql, [memberName, memberMob, memberBir, memberId]);
    console.log(result);
    if (result.affectedRows === 1) {
      output.success = true;

    } else {
      output.error = "更新個人資料失敗";
    }
  } catch (ex) {
    console.log(ex);
    output.error = "建議您檢查是否輸入新資料";

  }

  res.json(output);

});

// 會員中心更改以及新增地址
router.put("/member/addressChange", jwtVerify, async (req, res) => {
  const output = {
    success: false,
    postData: req.body,
    error: ""
  };

  const memberAddr = req.body.member_city + req.body.member_zip + req.body.member_address;
  const memberId = res.locals.auth[0].member_id;
  const sql = "UPDATE member SET member_addr=?WHERE member_id = ?";

  try {
    [result] = await db.query(sql, [memberAddr, memberId]);
    console.log(result);
    if (result.affectedRows === 1) {
      output.success = true;

    } else {
      output.error = "更新會員地址失敗";
    }
  } catch (ex) {
    console.log(ex);
    output.error = "建議您檢查是否輸入新資料";

  }

  res.json(output);

});

// 帶會員id拿取酒標作品資料
router.post("/member/MemberMark", jwtVerify, async (req, res) => {

  const memberId = res.locals.auth[0].member_id;
  console.log(memberId);
  const sql = "SELECT `pics`, `mark_name`, `mark_id` FROM `mark` WHERE `member_id` =?";
  const [rs] = await db.query(sql, [memberId]);
  console.log(rs);
  res.json(rs);

});

// 帶會員id刪除酒標作品資料
router.delete("/member/MemberMarkDelete", jwtVerify, async (req, res) => {

  const output = {
    success: false
  };

  const markId = req.body.mark_id;
  const memberId = res.locals.auth[0].member_id;
  const sql = `DELETE FROM \`mark\` WHERE \`member_id\` = ? AND \`mark_id\` IN(?)`;
  const [rs] = await db.query(sql, [memberId, markId]);
  console.log(rs);
  if (rs.affectedRows >= 1) {
    output.success = true;
  }
  res.json(output);

});

// 帶會員id拿取收藏商品資料
router.post("/member/MemberFav", jwtVerify, async (req, res) => {
  const memberId = res.locals.auth[0].member_id;
  const sql = "SELECT `member_id`,`pro_price`,`pro_mark`,`pro_name`,`pro_img`,`favorite`.`pro_id`" +
    " FROM `product_sake` INNER JOIN `favorite` ON `favorite`.`pro_id` = `product_sake`.`pro_id`" +
    " INNER JOIN `product_format` ON  `product_format`.`format_id` = `product_sake`.`format_id` WHERE `member_id` = ?";
  const [rs] = await db.query(sql, [memberId]);
  res.json(rs);
});

// 控制收藏愛心以取消收藏
router.post("/member/MemberFav/delete", async (req, res) => {
  const output = {
    success: false,
    error: ""
  };
  console.log(req.body);
  // const userAccount = res.locals.auth;
  // const getMidPid = `SELECT \`member_id\`,\`pro_id\` FROM \`favorite\`WHERE \`member_id\` = ${userAccount['member_id']}`
  // const [rs] = await db.query(getMidPid);
  const sql = `DELETE
               FROM \`favorite\`
               WHERE \`member_id\` = ?
                 AND \`pro_id\` = ?`;
  const [result] = await db.query(sql, [
    parseInt(req.body.member_id),
    parseInt(req.body.pro_id)
  ]);

  console.log(result);
  output.success = !!result.affectedRows; //rowcount主為布林職
  output.result = result;

  res.json(output);
});

// 帶會員id拿取訂閱清單資料
router.post("/member/MemberSublist", jwtVerify, async (req, res) => {
  const memberId = res.locals.auth[0].member_id;
  const fm = ("YYYY-MM-DD");
  const sql1 = "SELECT \`order_main\`.\`member_id\`,\`order_main\`.\`order_date\`,\`sub_time\`,\`order_sub_d\`.\`order_state\`,\`order_sub_d\`.\`subtime_id\`,\`order_sub_d\`.\`order_d_id\`,\`order_sub_d\`.\`order_id\`" +
    "FROM \`order_main\`" +
    "INNER JOIN \`order_sub_d\` ON \`order_main\`.\`order_id\` = \`order_sub_d\`.\`order_id\` " +
    "INNER JOIN \`sub_time\` ON \`sub_time\`.\`subtime_id\` = \`order_sub_d\`.\`subtime_id\`" +
    "WHERE \`order_main\`.\`member_id\` = ?";

  const [rs0] = await db.query(sql1, [memberId]);
  const rs1 = rs0.map((v) => ({ ...v, order_date: moment(v.order_date).format(fm) }));
  const sql2 = "SELECT \`order_sub_d\`.\`sub_id\`, \`order_sub_d\`.\`order_d_price\`, \`member_id\`" +
    "FROM \`order_sub_d\`" +
    "LEFT JOIN \`order_main\` ON \`order_main\`.\`order_id\` = \`order_sub_d\`.\`order_id\`" +
    "LEFT JOIN \`sub_plan\` ON \`sub_plan\`.\`sub_id\` = \`order_sub_d\`.\`sub_id\`" +
    "WHERE \`order_main\`.\`member_id\` = ?";

  const [rs2] = await db.query(sql2, [memberId]);

  const sql3 = "SELECT \`card_num\`, \`member_id\`" +
    "FROM \`payment_detail\`" +
    "LEFT JOIN \`order_main\` ON \`order_main\`.\`order_id\` = \`payment_detail\`.\`order_id\`" +
    "WHERE \`member_id\` = ?";

  const [rs3] = await db.query(sql3, [memberId]);

  const sub_id_arr = JSON.parse(rs2[0].sub_id);
  let new_data = [];
  let info_data = {
    order_id: rs1[0]["order_id"],
    order_d_price: rs2[0]["order_d_price"],
    card_num: rs3[0]["card_num"],
    order_date: rs1[0]["order_date"],
    order_state: rs1[0]["order_state"],
    sub_time: rs1[0]["sub_time"],
    sub_id: rs2[0]["sub_id"]
  };

  let plan_name = function(sub_id) {
    if (sub_id === 1) {
      return "純米";
    }
    if (sub_id === 2) {
      return "純米吟釀";
    }
    if (sub_id === 3) {
      return "純米大吟釀";
    }
  };
  let plan_price = function(sub_id) {
    if (sub_id === 1) {
      return 1300;
    }
    if (sub_id === 2) {
      return 1500;
    }
    if (sub_id === 3) {
      return 1800;
    }
  };
  sub_id_arr.forEach((sub_id) => {
    const data_row = {
      sub_id: sub_id,
      plan_name: plan_name(sub_id),
      plan_price: plan_price(sub_id),
      order_id: rs1[0]["order_id"],
      order_d_price: rs2[0]["order_d_price"],
      card_num: rs3[0]["card_num"],
      order_date: rs1[0]["order_date"],
      order_state: rs1[0]["order_state"],
      sub_time: rs1[0]["sub_time"]
    };
    new_data = [...new_data, data_row];
  });
  res.json([info_data, new_data]);
});
// 已過期
router.post("/member/MemberSublist/over", jwtVerify, async (req, res) => {
  const memberId = res.locals.auth[0].member_id;
  let sqlWhere = "";
  const fm = ("YYYY-MM-DD");
  if (memberId) sqlWhere += ` AND \`order_sub_d\`.\`order_state\` = '已結束'`;
  const sql1 = `SELECT \`order_main\`.\`member_id\`,\`order_main\`.\`order_date\`,\`sub_time\`,\`order_sub_d\`.\`order_state\`,\`order_sub_d\`.\`subtime_id\`,\`order_sub_d\`.\`order_d_id\`,\`order_sub_d\`.\`order_id\`
    FROM \`order_sub_d\` 
    INNER JOIN \`order_main\` ON \`order_main\`.\`order_id\` = \`order_sub_d\`.\`order_id\`  
    INNER JOIN \`sub_time\` ON \`sub_time\`.\`subtime_id\` = \`order_sub_d\`.\`subtime_id\` 
    WHERE \`order_main\`.\`member_id\` = ? ${sqlWhere}`;

  const [rs0] = await db.query(sql1, [memberId]);
  const rs1 = rs0.map((v) => ({ ...v, order_date: moment(v.order_date).format(fm) }));

  const sql2 = "SELECT \`order_sub_d\`.\`sub_id\`, \`order_sub_d\`.\`order_d_price\`, \`member_id\`" +
    "FROM \`order_sub_d\`" +
    "LEFT JOIN \`order_main\` ON \`order_main\`.\`order_id\` = \`order_sub_d\`.\`order_id\`" +
    "LEFT JOIN \`sub_plan\` ON \`sub_plan\`.\`sub_id\` = \`order_sub_d\`.\`sub_id\`" +
    "WHERE \`order_main\`.\`member_id\` = ?";

  const [rs2] = await db.query(sql2, [memberId]);

  const sql3 = "SELECT \`card_num\`, \`member_id\`" +
    "FROM \`payment_detail\`" +
    "LEFT JOIN \`order_main\` ON \`order_main\`.\`order_id\` = \`payment_detail\`.\`order_id\`" +
    "WHERE \`member_id\` = ?";

  const [rs3] = await db.query(sql3, [memberId]);
  const sub_id_arr = JSON.parse(rs2[0].sub_id);
  let new_data = [];
  let info_data = {
    order_id: rs1[0]["order_id"],
    order_d_price: rs2[0]["order_d_price"],
    card_num: rs3[0]["card_num"],
    order_date: rs1[0]["order_date"],
    order_state: rs1[0]["order_state"],
    sub_time: rs1[0]["sub_time"],
    sub_id: rs2[0]["sub_id"]
  };

  let plan_name = function(sub_id) {
    if (sub_id === 1) {
      return "純米";
    }
    if (sub_id === 2) {
      return "純米吟釀";
    }
    if (sub_id === 3) {
      return "純米大吟釀";
    }
  };
  let plan_price = function(sub_id) {
    if (sub_id === 1) {
      return 1300;
    }
    if (sub_id === 2) {
      return 1500;
    }
    if (sub_id === 3) {
      return 1800;
    }
  };
  sub_id_arr.forEach((sub_id) => {
    const data_row = {
      sub_id: sub_id,
      plan_name: plan_name(sub_id),
      plan_price: plan_price(sub_id),
      order_id: rs1[0]["order_id"],
      order_d_price: rs2[0]["order_d_price"],
      card_num: rs3[0]["card_num"],
      order_date: rs1[0]["order_date"],
      order_state: rs1[0]["order_state"],
      sub_time: rs1[0]["sub_time"]
    };
    new_data = [...new_data, data_row];
  });
  res.json([info_data, new_data]);
  // const output = {
  //   data1: rs1[0],
  //   data2: rs2[0],
  //   data3: rs3[0]
  // };
  // console.log(output);
  // res.json(output);
});

// 帶會員id拿取訂單資料
router.post("/member/MemberOrderList", jwtVerify, async (req, res) => {
  const memberId = res.locals.auth[0].member_id;
  // const state = res.body.order_state ? res.body.order_state : '';
  const fm = ("YYYY-MM-DD");
  const perPage = 6;//一頁幾筆
  //用戶要看第幾頁
  let page = req.body.page ? parseInt(req.body.page) : 1;
  //輸出
  const
    output = {
      //success: false,
      perPage,
      page,
      totalRows: 0,
      totalPages: 0,
      rows: [],
      rs: "",
      tabData: ""
    };

  const t_sql = `SELECT COUNT(1) num
                 FROM \`order_main\`
                        INNER JOIN \`order_sake_d\` ON \`order_sake_d\`.\`order_id\` = \`order_main\`.\`order_id\`
               WHERE \`member_id\` = ?`;
  const [rs1] = await db.query(t_sql, [memberId]);
  const totalRows = rs1[0].num;
  //let totalPages = 0;
  if (totalRows) {
    output.totalPages = Math.ceil(totalRows / perPage);
    output.totalRows = totalRows;

    const sql = `SELECT \`order_state\`, \`used_code\`, \`order_name\`, \`order_email\`, \`order_mobile\`, \`order_d_price\`, \`order_date\`, \`member_id\`, \`order_main\`.\`order_id\`,\`order_sake_d\`.\`order_d_id\`, \`product_sake\`.\`pro_img\`, \`product_sake\`.\`pro_name\`, \`product_format\`.\`pro_capacity\`, \`shipment_detail\`.\`shipment_method\`, \`shipment_detail\`.\`shipment_address\`, \`payment_detail\`.\`card_num\`
  FROM \`order_sake_d\`
  LEFT JOIN \`order_main\` ON \`order_main\`.\`order_id\` = \`order_sake_d\`.\`order_id\`
  LEFT JOIN \`product_sake\` ON \`order_sake_d\`.\`pro_id\` = \`product_sake\`.\`pro_id\`
  LEFT JOIN \`product_format\` ON \`product_sake\`.\`format_id\` = \`product_format\`.\`format_id\`
  LEFT JOIN \`shipment_detail\` ON \`order_main\`.\`order_id\` = \`shipment_detail\`.\`order_id\`
  LEFT JOIN \`payment_detail\` ON \`order_main\`.\`order_id\` = \`payment_detail\`.\`order_id\`
  WHERE \`member_id\` = ? ORDER BY \`order_id\` DESC LIMIT ${perPage * (page - 1)}, ${perPage}`;
    const [rs2] = await db.query(sql, [memberId]);

    output.rows = rs2.map((v) => ({ ...v, order_date: moment(v.order_date).format(fm) }));
  }
  const sql2 = `SELECT \`order_state\`, \`order_d_price\`, \`order_date\`, \`member_id\`, \`order_main\`.\`order_id\`, \`order_sake_d\`.\`order_d_id\`
               FROM \`order_main\`
                        INNER JOIN \`order_sake_d\` ON \`order_sake_d\`.\`order_id\` = \`order_main\`.\`order_id\`
               WHERE \`member_id\` = ?`;
  const [rs] = await db.query(sql2, [memberId]);

  const sql3 = `SELECT \`order_state\`, \`used_code\`, \`order_name\`, \`order_email\`, \`order_mobile\`, \`order_d_price\`, \`order_date\`, \`member_id\`, \`order_main\`.\`order_id\`, \`product_sake\`.\`pro_img\`, \`product_sake\`.\`pro_name\`, \`product_format\`.\`pro_capacity\`, \`shipment_detail\`.\`shipment_method\`, \`shipment_detail\`.\`shipment_address\`, \`payment_detail\`.\`card_num\`
  FROM \`order_main\`
  INNER JOIN \`order_sake_d\` ON \`order_main\`.\`order_id\` = \`order_sake_d\`.\`order_id\`
  INNER JOIN \`product_sake\` ON \`order_sake_d\`.\`pro_id\` = \`product_sake\`.\`pro_id\`
  INNER JOIN \`product_format\` ON \`product_sake\`.\`format_id\` = \`product_format\`.\`format_id\`
  INNER JOIN \`shipment_detail\` ON \`order_main\`.\`order_id\` = \`shipment_detail\`.\`order_id\`
  INNER JOIN \`payment_detail\` ON \`order_main\`.\`order_id\` = \`payment_detail\`.\`order_id\`
  WHERE \`member_id\` = ?`;
  output.tabData = await db.query(sql3, [memberId]);

  output.rs = rs.map((v) => ({ ...v, order_date: moment(v.order_date).format(fm) }));
  res.json(output);
});
// 拿取訂單總覽資料
router.post("/member/MemberOrderListTotal", jwtVerify, async (req, res) => {
  const memberId = res.locals.auth[0].member_id;
  const fm = ("YYYY-MM-DD");
  // const perPage = 6;//一頁幾筆
  //用戶要看第幾頁
  // let page = req.body.page ? parseInt(req.body.page) : 1;
  //輸出
  const
    output = {
      //success: false,
      // perPage,
      // page,
      // totalRows: 0,
      // totalPages: 0,
      // rows: [],
      rs: ""
      // tabData: ""
    };

  const sql = `SELECT m.\`order_id\`, m.\`order_date\`, (SUM(s.\`order_d_price\`) + SUM(g.\`order_d_price\`)) AS total_price, s.\`order_state\`, g.\`order_state\`
               FROM \`order_main\` m 
               INNER JOIN \`order_sake_d\` s ON m.\`order_id\` = s.\`order_id\`
               INNER JOIN \`order_gift_d\` g ON m.\`order_id\` = g.\`order_id\`
               WHERE m.\`member_id\` = ? AND m.\`type\` = 'S'
               GROUP BY m.\`order_id\``;

  const [rs] = await db.query(sql, [memberId]);
  output.rs = rs.map((v) => ({ ...v, order_date: moment(v.order_date).format(fm) }));
  res.json(output);
});
// 拿取訂購酒的詳細資料
router.post("/order-sake", async (req, res) => {
  const order_id = req.body.order_id
    ? parseInt(req.body.order_id)
    : "20220110001";
  const sql = `SELECT omain.order_id, osd.order_quantity, osd.order_d_price,
                omark.order_mark_id, mark.mark_name, ps.pro_name, ps.pro_img, pf.pro_price, pf.pro_capacity
                FROM order_main omain

                LEFT JOIN order_sake_d osd
                ON omain.order_id = osd.order_id

                LEFT JOIN order_mark omark
                ON osd.order_d_id = omark.order_d_id

                LEFT JOIN mark
                ON omark.mark_id=mark.mark_id

                LEFT JOIN product_sake ps
                ON osd.pro_id=ps.pro_id

                LEFT JOIN product_format pf
                ON ps.pro_id=pf.format_id

                WHERE omain.order_id =?;`;
  const [result, fields] = await db.query(sql, [order_id]);
  res.json(result);
});
// 拿取訂購禮盒的詳細資料
router.post("/order-gift", async (req, res) => {
  const order_id = req.body.order_id
    ? parseInt(req.body.order_id)
    : "20220110001";
  const sql = `SELECT omain.order_id, og.order_quantity, og.order_d_price, 
                og.gift_id, og.box_color, ogdd.pro_id, ps.pro_name, ps.pro_img, pf.pro_price, pf.pro_capacity, pg.gift_name
                FROM order_main omain

                LEFT JOIN order_gift_d og
                ON omain.order_id=og.order_id

                LEFT JOIN order_gift_d_d ogdd
                ON og.order_g_id=ogdd.order_g_id

                LEFT JOIN product_sake ps
                ON ogdd.pro_id=ps.pro_id

                LEFT JOIN product_format pf
                ON ps.pro_id=pf.format_id

                LEFT JOIN product_container pc
                ON pf.container_id=pc.container_id

                LEFT JOIN product_gift pg 
                ON og.gift_id=pg.gift_id

                WHERE omain.order_id =?;`;
  const [result, fields] = await db.query(sql, [order_id]);
  let tidyResult = [];
  let twoInOne = {};
  let twoInOne_cartGiftId = 0;
  for (const i of result) {
    if (i.gift_id === 3) {
      if (i.cart_gift_id !== twoInOne_cartGiftId) {
        twoInOne_cartGiftId = i.cart_gift_id;
        console.log(twoInOne_cartGiftId);
        twoInOne.cart_gift_id = i.cart_gift_id;
        twoInOne.member_id = i.member_id;
        twoInOne.order_quantity = i.order_quantity;
        twoInOne.gift_id = i.gift_id;
        twoInOne.gift_name = i.gift_name;
        twoInOne.box_color = i.box_color;

        twoInOne.pro_one = {
          pro_id: i.pro_id,
          pro_name: i.pro_name,
          pro_img: i.pro_img,
          pro_price: i.pro_price,
          pro_capacity: i.pro_capacity,
        };
      } else {
        twoInOne.pro_two = {
          pro_id: i.pro_id,
          pro_name: i.pro_name,
          pro_img: i.pro_img,
          pro_price: i.pro_price,
          pro_capacity: i.pro_capacity,
        };
        tidyResult = [...tidyResult, { ...twoInOne }];
      }
    } else {
      tidyResult = [...tidyResult, i];
    }
  }
  console.log(tidyResult);
  res.json(tidyResult);
  // res.json(result);
});
// 拿取訂購丹的詳細資料
router.post("/order-info", async (req, res) => {
  const order_id = req.body.order_id
    ? parseInt(req.body.order_id)
    : "20220110001";
  console.log(order_id);
  const sql = `SELECT om.order_id, om.order_name, om.order_mobile, 
                om.order_email, om.used_code, om.order_date, pd.card_num, sd.shipment_method, sd.ship_fee, sd.store_id, sd.receiver, sd.receiver_mobile, sd.shipment_address, sd.shipment_note, store.store_name, store.store_address FROM order_main om 
                LEFT JOIN payment_detail pd
                ON om.order_id=pd.order_id
                LEFT JOIN shipment_detail sd
                ON om.order_id=sd.order_id
                LEFT JOIN store
                ON sd.store_id = store.store_id

                WHERE om.order_id =?;`;
  const [result, fields] = await db.query(sql, [order_id]);
  res.json(result);
});


// 帶會員id拿取活動記錄資料
router.post("/member/MemberEventList", jwtVerify, async (req, res) => {
  const memberId = res.locals.auth[0].member_id;
  const fm = ("YYYY-MM-DD");
  const sql = `SELECT \`order_d_id\`,\`order_event_d\`.\`order_name\`,\`order_event_d\`.\`order_mobile\`,\`order_event_d\`.\`order_email\`,\`order_state\`,\`order_event_d\`.\`order_id\`,\`order_d_price\`,\`order_date\`,\`member_id\`,\`event_location\`,\`event_name\`,\`event_time_start\`
               FROM \`order_main\`
               INNER JOIN \`order_event_d\` ON \`order_main\`.\`order_id\` = \`order_event_d\`.\`order_id\`
               INNER JOIN \`event\` ON \`event\`.\`event_id\` = \`order_event_d\`.\`event_id\`
               WHERE \`member_id\` = ?`;
  const [rs] = await db.query(sql, [memberId]);
  const rs2 = rs.map((v) => ({
    ...v,
    event_time_start: moment(v.event_time_start).format(fm),
    order_date: moment(v.order_date).format(fm)
  }));
  res.json(rs2);
});
// 已參加
router.post("/member/MemberEventAlready", jwtVerify, async (req, res) => {
  const memberId = res.locals.auth[0].member_id;
  const fm = ("YYYY-MM-DD");
  let sqlWhere = "";
  if (memberId) sqlWhere += ` AND  order_state = '已參加'`;
  const sql = `SELECT \`order_d_id\`,\`order_event_d\`.\`order_name\`,\`order_event_d\`.\`order_mobile\`,\`order_event_d\`.\`order_email\`,\`order_state\`,\`order_event_d\`.\`order_id\`,\`order_d_price\`,\`order_date\`,\`member_id\`,\`event_location\`,\`event_name\`,\`event_time_start\`
               FROM \`order_main\`
               INNER JOIN \`order_event_d\` ON \`order_main\`.\`order_id\` = \`order_event_d\`.\`order_id\`
               INNER JOIN \`event\` ON \`event\`.\`event_id\` = \`order_event_d\`.\`event_id\`
               WHERE \`member_id\` = ? ${sqlWhere}`;
  const [rs] = await db.query(sql, [memberId]);
  const rs2 = rs.map((v) => ({
    ...v,
    event_time_start: moment(v.event_time_start).format(fm),
    order_date: moment(v.order_date).format(fm)
  }));
  res.json(rs2);
});
// 已取消
router.post("/member/MemberEventCancel", jwtVerify, async (req, res) => {
  const memberId = res.locals.auth[0].member_id;
  const fm = ("YYYY-MM-DD");
  let sqlWhere = "";
  if (memberId) sqlWhere += ` AND  order_state = '已取消'`;
  const sql = `SELECT \`order_d_id\`,\`order_event_d\`.\`order_name\`,\`order_event_d\`.\`order_mobile\`,\`order_event_d\`.\`order_email\`,\`order_state\`,\`order_event_d\`.\`order_id\`,\`order_d_price\`,\`order_date\`,\`member_id\`,\`event_location\`,\`event_name\`,\`event_time_start\`
               FROM \`order_main\`
               INNER JOIN \`order_event_d\` ON \`order_main\`.\`order_id\` = \`order_event_d\`.\`order_id\`
               INNER JOIN \`event\` ON \`event\`.\`event_id\` = \`order_event_d\`.\`event_id\`
               WHERE \`member_id\` = ? ${sqlWhere}`;
  const [rs] = await db.query(sql, [memberId]);
  const rs2 = rs.map((v) => ({
    ...v,
    event_time_start: moment(v.event_time_start).format(fm),
    order_date: moment(v.order_date).format(fm)
  }));
  res.json(rs2);
});

// 修改會員資料
router.route("/edit")
  .get(jwtVerify, async (req, res) => {
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
      res.render("user/edit", { row: rs[0] });
    } else {
      res.redirect("/user/list");
    }
  })
  .post(jwtVerify, async (req, res) => {
    const output = {
      success: false,
      postData: req.body
    };
    const hash = await bcrypt.hash(req.body.user_pass, 10);
    const input = { ...req.body };
    const sql = `UPDATE \`user\` u INNER JOIN \`member\` m
                 ON u.user_id = m.user_id
                     SET u.user_pass=?, m.member_name=?, m.member_bir=?, m.member_mob=?, m.member_addr=?
                 WHERE u.user_id=? AND m.user_id=?`;
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
        req.params.user_id
      ]);
    } catch (ex) {
      output.error = ex.toString();
    }
    output.result = result;
    if (result.affectedRows === 2) {
      if (result.changedRows === 2) {
        output.success = true;
      } else {
        output.error = "資料沒有變更";

      }
    }

    res.json(output);
  });

module.exports = router;


