var express = require('express');
var router = express.Router();
const db = require("../modules/connect-db");

// 其實cart_order(order_main)會先insert資料，再輪到cart_info(shipment, payment)
/* 新增 貨運資訊 --- */

router.post('/shipment', async(req, res)=>{
    
    const output = {
        success: false,
        error: ''
    }
    // TODO:
    // order_id要去跟order_main資料表新增的order_id一樣
    const sql = "INSERT INTO `shipment_detail`(`order_id`, `shipment_method`, `store_id`, `receiver`, `receiver_mobile`, `shipment_address`, `shipment_note`) VALUES (?, ?, ?, ?, ?, ?, ?)";
    // result 需用[]包起來，因為回傳值是array，可以參照array 接值 補充
    const [result] = await db.query(sql, [
        req.body.order_id,
        req.body.shipment_method,
        req.body.store_id ? req.body.store_id: 0,
        req.body.receiver,
        req.body.receiver_mobile,
        req.body.shipment_address,
        req.body.shipment_note? req.body.shipment_note: ''
    ]);
    console.log(result);
    output.success = !! result.affectedRows;
    output.result = result;
    res.json(output)
})

/* 新增 付款資訊  ---*/

router.post('/payment', async(req, res)=>{
    
    const output = {
        success: false,
        error: ''
    }
    // TODO:
    // order_id要去跟order_main資料表新增的order_id一樣
    const sql = "INSERT INTO `payment_detail`(`order_id`, `card_num`) VALUES (?, ?)";
    // result 需用[]包起來，因為回傳值是array，可以參照array 接值 補充
    const [result] = await db.query(sql, [
        req.body.order_id,
        req.body.card_num,
    ]);
    output.success = !! result.affectedRows;
    output.result = result;
    res.json(output)
})

/*讀取 會員資訊  ---*/
router.get('/member', async(req, res)=>{
    const member_id = req.query.member_id ? parseInt(req.query.member_id) : 'no member_id'
    const sql = "SELECT member.*, user.user_account FROM `member` LEFT JOIN user ON member.user_id = user.user_id WHERE member_id =?;"

    const [result, fields] =  await db.query(sql, [member_id])

    res.json(result)
    
})


module.exports = router;
