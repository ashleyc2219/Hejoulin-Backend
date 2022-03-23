const router = require("express").Router();
const db = require("../modules/connect-db");

// Get all spmenu : http://localhost:3000/api/spmenu
// Get specific spmenu : http://localhost:3000/api/spmenu?resId=1
router.get("/", async (req, res) => {
  let search = req.query.search ? req.query.search : ""; // like %keyword%
  let level = req.query.pro_level ? req.query.pro_level : "";
  let loca = req.query.pro_loca ? req.query.pro_loca : "";
  let brand = req.query.pro_brand ? req.query.pro_brand : "";
  let price = req.query.pro_price ? req.query.pro_price : "";
  let mark = req.query.pro_mark ? req.query.pro_mark : "";

  let order = req.query.order ? req.query.order : "";
  let perpage = req.query.perpage ? req.query.perpage : "";
  //perpage = 9;
  console.log(loca);
  let limit = perpage ? ` limit 0 , ${perpage}` : "";

  let sqlWhere = "WHERE 1";
  let sqlOrder = "";
console.log(price)
  const output = {
    perpage: 0,
    totalRows: 0,
    totalPages: 0,
    rows: [],
  };

  if (level == 1) sqlWhere += ` AND pro_level = '吟釀'`;
  if (level == 2) sqlWhere += ` AND pro_level = '大吟釀'`;
  if (level == 3) sqlWhere += ` AND pro_level = '純米酒'`;
  if (level == 4) sqlWhere += ` AND pro_level = '純米吟釀'`;
  if (level == 5) sqlWhere += ` AND pro_level = '純米大吟釀'`;
  if (level == 6) sqlWhere += ` AND pro_level = '本釀造'`;
  if (loca) sqlWhere += ` AND pro_loca = '${loca}'`;
  if (brand) sqlWhere += ` AND pro_brand = '${brand}'`;
  if (price == 1) sqlWhere += ` AND pro_price <= 1000`;
  if (price == 2) sqlWhere += ` AND pf.pro_price BETWEEN 1000 AND 2001`;
  if (price == 3) sqlWhere += ` AND pf.pro_price BETWEEN 1999 AND 3000`;
  if (price == 4) sqlWhere += ` AND pro_price > 3000`;
  if (mark == 1) sqlWhere += ` AND pro_mark = 1`;
  if (order == 1) sqlOrder += ` ORDER BY pro_id ASC`; //預設排序 sid由小到大
  if (order == 2) sqlOrder += ` ORDER BY pro_creat_time ASC`; // 上架時間由新到舊
  if (order == 3) sqlOrder += ` ORDER BY pro_creat_time DESC`; // 上架時間由舊到新
  if (order == 4) sqlOrder += ` ORDER BY pro_price ASC`; // 售價由低到高
  if (order == 5) sqlOrder += ` ORDER BY pro_price DESC`; // 售價由高到低
  if (order == 6) sqlOrder += ` ORDER BY pro_selling DESC`; // 銷售量

  if (search.length > 0) {
    sqlWhere = `WHERE pro_name LIKE ${db.escape("%" + search + "%")}`;
    const sql = `SELECT * FROM product_sake ps LEFT JOIN product_format pf ON ps.format_id = pf.format_id ${sqlWhere}${sqlOrder}`;
    const [rs, fields] = await db.query(sql);
    output.rows = rs;
    return res.json(output);
  }

  const t_sql = `SELECT COUNT(1) num FROM product_sake ps LEFT JOIN product_format pf ON ps.format_id = pf.format_id ${sqlWhere}${limit}`;

  const sql = `SELECT * FROM product_sake ps LEFT JOIN product_format pf ON ps.format_id = pf.format_id ${sqlWhere}${sqlOrder}${limit}`;

  const [rs, fields] = await db.query(sql);
  const [a, b] = await db.query(t_sql);
  output.totalRows = a[0].num;
  output.rows = rs;

  return res.json(output);
  //return res.json(rs);
});

module.exports = router;
