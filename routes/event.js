const router = require("express").Router();
const db = require("../modules/connect-db");
const moment = require("moment-timezone");

// Get all event : http://localhost:3001/api/event
// Get specific event by event id : http://localhost:3001/api/event?eventId=2
// Get specific event by event cat  : http://localhost:3001/api/event?eventCatId=1
router.get("/", async (req, res) => {
  const fm = ('YYYY-MM-DD HH:MM')
  const fm2 = ('HH:MM')
  if (req.query.eventId) {
    const { eventId } = req.query;
    const sql = `SELECT * FROM event e LEFT JOIN event_cat ec ON e.event_cat_id = ec.event_cat_id WHERE event_id = ${eventId}`;
    const [rs, fields] = await db.query(sql);
    const rs2 =rs.map((v)=>({...v, event_time_start: moment(v.event_time_start).format(fm)}))
    const rs3 =rs2.map((v)=>({...v, event_time_end: moment(v.event_time_end).format(fm2)}))
    console.log(rs3)
    return res.json(rs3);
  }
  if (req.query.eventCatId) {
    const { eventCatId } = req.query;
    const sql = `SELECT * FROM event WHERE event_cat_id = ${eventCatId}`;
    const [rs, fields] = await db.query(sql);
    return res.json(rs);
  }
  const sql = "SELECT * FROM `event` e LEFT JOIN `event_cat` ec ON e.event_cat_id = ec.event_cat_id ";
  const [rs, fields] = await db.query(sql);
  res.json(rs);
});

// Get all event cat : http://localhost:3001/api/event/cat
// Get specific event cat : http://localhost:3001/api/event/cat?eventCatId=2
router.get("/cat", async (req, res) => {
  if (req.query.eventCatId) {
    const { eventCatId } = req.query;
    const sql = `SELECT * FROM event_cat WHERE event_cat_id = ${eventCatId}`;
    const [rs, fields] = await db.query(sql);
    return res.json(rs);
  }
  const sql = "SELECT * FROM event_cat";
  const [rs, fields] = await db.query(sql);
  res.json(rs);
});

module.exports = router;
