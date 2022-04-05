const router = require('express').Router();
const db = require('../modules/connect-db');
const upload = require('./../modules/upload-images');
const { jwtVerify } = require('./../modules/jwtVerify');

const middleware = {
    upload,
    jwtVerify,
};

// Get all mark : http://localhost:3001/api/mark
// Get specific mark : http://localhost:3001/api/mark?markId=1
router.get('/', async (req, res) => {
    if (req.query.markId) {
        const { markId } = req.query;
        const sql = `SELECT * FROM mark WHERE mark_id = ${markId}`;
        const [rs, fields] = await db.query(sql);
        return res.json(rs);
    }
    const sql = 'SELECT * FROM mark';
    const [rs, fields] = await db.query(sql);
    res.json(rs);
});

// Get mark:http://localhost:3500/api/mark
// 寫入酒標
router.post('/', [middleware.upload.single('mark'), middleware.jwtVerify], async (req, res) => {
    const memberId = res.locals.auth[0].member_id;
    const output = {
        success: false,
        error: '',
    };
    const sql = 'INSERT INTO `mark`(`member_id`,`mark_name`,`pics`,`create_at`) VALUES (?, ?, ?, Now())';
    const [result] = await db.query(sql, [
        memberId, // 要改登入的member id
        req.body.markname, // 酒標名稱
        req.file.filename,
    ]);
    output.success = !!result.affectedRows; //rowcount主為布林職
    output.result = result;
    res.json(output);
});

module.exports = router;
