var express = require("express");
const { json } = require("express/lib/response");
const res = require("express/lib/response");
var router = express.Router();
const db = require("../modules/connect-db");

router.get("/sub-time", async (req, res) => {
  const sql =
    "SELECT st.subtime_id, st.sub_time, st.sub_discount, st.sub_time_month FROM `sub_time` st";
  const [result, fields] = await db.query(sql);
  res.json(result);
});
router.get("/sub-plan", async (req, res) => {
  const sql = "SELECT sp.sub_id, sp.sub_plan, sp.sub_price FROM `sub_plan` sp";
  const [result, fields] = await db.query(sql);
  res.json(result);
});
router.post("/order-sub", async (req, res) => {
  const output = {
    success: false,
    error: "",
  };

  const order_id = req.body.order_id;
  const sub_id = req.body.sub_id;
  // 處理前端傳過來的字串，轉成id數字再存進去

  const sql =
    "INSERT INTO `order_sub_d`(`order_id`, `sub_id`, `subtime_id`, `order_d_price`, `order_state`) VALUES (?,?,?,?,?)";
  const [result] = await db.query(sql, [
    order_id,
    sub_id,
    req.body.subtime_id,
    req.body.order_d_price,
    "進行中", // order_state
  ]);
  console.log(result);
  output.success = !!result.affectedRows;
  output.result = result;
  res.json([output, order_id]);
});
// 生成order_id
function order_id_generator() {
  let nowDate = new Date();
  let year = nowDate.getFullYear().toString();
  // getMonth 會是 0-11，所以要加一
  let month = (nowDate.getMonth() + 1).toString();
  let date = nowDate.getDate().toString();
  console.log(nowDate);
  // 如果是 1-9月 或 1-9日 要變成 01-09
  if (month.length == 1) {
    month = "0" + month;
  }
  if (date.length == 1) {
    date = "0" + date;
  }
  let newDate = year + month + date;
  return search_order_id(newDate);
}
// 用今天的日期去資料表裡搜尋 order_id
async function search_order_id(dateString) {
  const sql =
    "SELECT * FROM `order_main` WHERE `order_id` LIKE? ORDER BY `order_id` DESC LIMIT 1";
  const [result, fields] = await db.query(sql, [dateString + "%"]);
  // 如果當日已有訂單建立 則最後一筆order_id+1
  if (result[0]) {
    let last_order_id = result[0].order_id;
    let new_order_id = parseInt(last_order_id) + 1;
    return new_order_id;
  } // 如果是今天第一筆訂單 則 當日日期 + 001
  else {
    let new_order_id = dateString + "001";
    return new_order_id;
  }
}
// 宣告order_id在所有rourt外面，因為都用同一個order_id ---
// TODO: 把order_id都改成下面這個
let order_id = "";
router.post("/order-main", async (req, res) => {
  const output = {
    success: false,
    error: "",
  };

  // 由order_main生成的，存到外面，讓大家都用一個
  order_id = await order_id_generator();

  // 取得生成的order_id後，開始新增資料
  // TODO:
  // member_id要去拿登入的member_id
  const sql =
    "INSERT INTO `order_main`(`order_id`, `member_id`, `order_name`, `order_mobile`, `order_email`, `type`, `used_code`, `order_date`) VALUES (?,?,?,?,?,?,?, NOW())";
  const [result] = await db.query(sql, [
    order_id,
    req.body.member_id,
    req.body.order_name,
    req.body.order_mobile,
    req.body.order_email,
    "B", //order_type 一定是 B
    req.body.used_code ? req.body.used_code : "",
  ]);
  console.log(result);
  output.success = !!result.affectedRows;
  output.result = result;
  res.json([output, order_id]);
});

router.get("/order-sub", async (req, res) => {
  const order_id = req.query.order_id
    ? parseInt(req.query.order_id)
    : "20220406004";
  const sql = `SELECT om.order_id, om.member_id, om.order_name, om.order_mobile, om.order_email, osd.sub_id, osd.subtime_id, osd.order_d_price, st.sub_time_month, st.sub_discount, sd.shipment_method, sd.ship_fee, sd.receiver, sd.receiver_mobile, sd.shipment_address, pd.card_num FROM order_main om 
            LEFT JOIN order_sub_d osd
            ON om.order_id = osd.order_id
            LEFT JOIN sub_time st
            ON osd.subtime_id = st.subtime_id
            LEFT JOIN payment_detail pd
            ON om.order_id=pd.order_id
            LEFT JOIN shipment_detail sd
            ON om.order_id=sd.order_id WHERE om.order_id=?;`;

  const [result, fields] = await db.query(sql, [order_id]);
  const sub_id_arr = JSON.parse(result[0].sub_id);
  let new_data = [];
  let info_data = {
    order_id: result[0]["order_id"],
    order_name: result[0]["order_name"],
    order_mobile: result[0]["order_mobile"],
    order_email: result[0]["order_email"],
    order_d_price: result[0]["order_d_price"],
    shipment_method: result[0]["shipment_method"],
    ship_fee: result[0]["ship_fee"],
    receiver: result[0]["receiver"],
    receiver_mobile: result[0]["receiver_mobile"],
    shipment_address: result[0]["shipment_address"],
    card_num: result[0]["card_num"],
  };
  let rice_percent = function (sub_id) {
    if (sub_id === 1) {
      return "70";
    }
    if (sub_id === 2) {
      return "60";
    }
    if (sub_id === 3) {
      return "50";
    }
  };
  let plan_name = function (sub_id) {
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
  let plan_price = function (sub_id) {
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
      subtime_id: result[0]["subtime_id"],
      plan_name: plan_name(sub_id),
      plan_price: plan_price(sub_id),
      rice_percent: rice_percent(sub_id),
      sub_time_month: result[0]["sub_time_month"],
      sub_discount: result[0]["sub_discount"],
    };
    new_data = [...new_data, data_row];
  });
  res.json([info_data, new_data]);
});

module.exports = router;
