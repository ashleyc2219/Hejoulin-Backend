const router = require("express").Router();
const db = require("../modules/connect-db");

// Get all event : http://localhost:3001/api/event
// Get specific event by event id : http://localhost:3001/api/event?eventId=2
// Get specific event by event cat  : http://localhost:3001/api/event?eventCatId=1
router.get("/", async (req, res) => {
  if (req.query.eventId) {
    const { eventId } = req.query;
    const sql = `SELECT * FROM event WHERE event_id = ${eventId}`;
    const [rs, fields] = await db.query(sql);
    return res.json(rs);
  }
  if (req.query.eventCatId) {
    const { eventCatId } = req.query;
    const sql = `SELECT * FROM event WHERE event_cat_id = ${eventCatId}`;
    const [rs, fields] = await db.query(sql);
    return res.json(rs);
  }
  const sql = "SELECT * FROM event";
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
