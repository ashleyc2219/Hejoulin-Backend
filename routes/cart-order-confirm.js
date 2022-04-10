var express = require("express");
var router = express.Router();
const db = require("../modules/connect-db");

router.get("/order-sake", async (req, res) => {
  const order_id = req.query.order_id
    ? parseInt(req.query.order_id)
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

// TODO: 禮盒送去前端的資料 要做合併跟處理
router.get("/order-gift", async (req, res) => {
  const order_id = req.query.order_id
    ? parseInt(req.query.order_id)
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

router.get("/order-info", async (req, res) => {
  const order_id = req.query.order_id
    ? parseInt(req.query.order_id)
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

module.exports = router;
