const router = require('express').Router();
const db = require('../modules/connect-db');

// Get all restaurant : http://localhost:3000/api/restaurant
// Get specific restaurant : http://localhost:3000/api/restaurant?resId=1
router.get('/', async (req, res) => {
    if (req.query.resId) {
        const { resId } = req.query;
        const sql = `SELECT * FROM restaurant WHERE res_id = ${resId}`;
        const [rs, fields] = await db.query(sql);
        return res.json(rs);
    }
    const sql = 'SELECT * FROM restaurant';
    const [rs, fields] = await db.query(sql);
    res.json(rs);
});

module.exports = router;
