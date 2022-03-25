var express = require("express");
const res = require("express/lib/response");
var router = express.Router();
const db = require("../modules/connect-db");

router.get('/sub-time', async(req, res)=>{
    const sql =
      "SELECT st.subtime_id, st.sub_time, st.sub_discount, st.sub_time_month FROM `sub_time` st";
    const [result, fields] = await db.query(sql);
    res.json(result);
})
router.get('/sub-plan', async(req, res)=>{
    const sql =
      "SELECT sp.sub_id, sp.sub_plan, sp.sub_price FROM `sub_plan` sp";
    const [result, fields] = await db.query(sql);
    res.json(result);
})
module.exports = router;