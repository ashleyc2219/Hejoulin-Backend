const router = require("express").Router();
const db = require("../modules/connect-db");


// Get all container:http://localhost:3001/api/gift_container
// Get one container:http://localhost:3001/api/gift_container?id=14
// 酒器資料
router.get("/", async (req, res) => {
  if(req.query.id){
    const{id}=req.query
    const sql = `SELECT * FROM product_container pc JOIN product_format pf ON pc.container_id = pf.container_id WHERE pf.container_id < 5 AND pf.format_id = ${id}`
    const [rs, fields] = await db.query(sql);
    return res.json(rs);
  }
  const sql = "SELECT * FROM product_container pc JOIN product_format pf ON pc.container_id = pf.container_id WHERE pc.container_id < 5";
  const [rs, fields] = await db.query(sql);
  return res.json(rs);
});

module.exports = router;
