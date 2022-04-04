require('dotenv').config();
const jwt = require("jsonwebtoken");
const db = require("../modules/connect-db");

function jwtVerify (req, res, next) {
  if (req.originalUrl === "/login/login") return next();
  let auth = req.get("Authorization");
  if (auth && auth.indexOf("Bearer ") === 0) {
    auth = auth.slice(7);
    jwt.verify(auth, process.env.JWT_KEY, async (err, member) => {
      if (err) {
        res.sendStatus(403);
      } else {
        let memberInfo = await db.query(
          `SELECT a1.user_id, a1.user_account, a2.member_id
            FROM user AS a1, member AS a2
             WHERE a1.user_id = a2.user_id AND a1.user_account = ?`,
          [member.userAccount]
        );
        res.locals.auth = memberInfo[0];
        next();
      }
    });
  } else {
    res.sendStatus(403);
  }
}
module.exports = { jwtVerify }
