var express = require('express');
var router = express.Router();
const db = require("../modules/connect-db");


/* GET users listing. */
router.get('/', async(req, res) => {
    const sql = "SELECT * FROM product_sake LIMIT 5"
    const [result, fields] = await db.query(sql);
    res.json(result)
});

module.exports = router;
