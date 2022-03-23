const express = require("express");
const app = express();
const fs = require("fs").promises;
const jwt = require("jsonwebtoken");
const db = require("./modules/connect-db");
// cors 跨源請求
const cors = require("cors");

const corsOptions = {
  credentials: true,
  origin: function (origin, cb) {
    console.log({ origin });
    cb(null, true);
  },
};

// Top-level middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// 註解掉才不會有 token forbidden的問題 不信你試試看
/* app.use(async (req, res, next) => {
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
          [member.user_account]
        );
        res.locals.auth = memberInfo[0][0];
        next();
      }
    });
  } else {
    res.sendStatus(403);
  }
}); */

// set static folder
app.use(express.static(__dirname + "/public"));

app.get("/", function (req, res) {
  res.send("<p>Hello express</p>");
});
// app.use("/api/product", require("./routes/product"));
app.use("/api/cart-list", require("./routes/cart-list"));
app.use("/api/cart-info", require("./routes/cart-info"));
app.use("/api/cart-order", require("./routes/cart-order"));
app.use("/api/restaurant", require("./routes/restaurant"));
app.use("/api/restaurant-pic", require("./routes/restaurant-pic"));
app.use("/api/spmenu", require("./routes/spmenu"));
app.use("/api/menu-pic", require("./routes/menu-pic"));
app.use("/api/news", require("./routes/news"));
app.use("/login", require("./routes/login"));
app.use("/user", require("./routes/user"));
app.use("/api/products-sake", require("./routes/products-sake"));
app.use("/api/products-sake-filter", require("./routes/products-sake-filter"));
app.use("/api/products-condition", require("./routes/products-condition"));
app.use("/api/products-addcart", require("./routes/products-addcart"));
app.use("/api/products-fav", require("./routes/products-fav"));
app.use("/api/guide_q", require("./routes/guide_q"));
app.use("/api/product_guide", require("./routes/guide_product"));
app.use("/api/gift", require("./routes/gift"));
app.use("/api/gift_container", require("./routes/gift_container"));
app.use("/api/product_gift", require("./routes/gift_product"));
app.use("/api/mark", require("./routes/mark"));

const port = 3001;
app.listen(port, () => {
  console.log(`server started ${port} - `, new Date());
});
