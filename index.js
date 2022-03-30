const express = require("express");
const app = express();
const fs = require("fs").promises;
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

// set static folder
app.use(express.static(__dirname + "/public"));

app.get("/", function (req, res) {
  res.send("<p>Hello express</p>");
});

app.use("/api/cart-list", require("./routes/cart-list"));
app.use("/api/cart-info", require("./routes/cart-info"));
app.use("/api/cart-order", require("./routes/cart-order"));
app.use("/api/cart-order-confirm", require("./routes/cart-order-confirm"));
app.use("/api/sub", require("./routes/sub"));

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
app.use("/api/products-cart-quantity", require("./routes/products-cart-quantity"));

app.use("/api/guide_q", require("./routes/guide_q"));
app.use("/api/product_guide", require("./routes/product_guide"));

app.use("/api/gift", require("./routes/gift"));
app.use("/api/gift_container", require("./routes/gift_container"));
app.use("/api/product_gift", require("./routes/product_gift"));
app.use("/api/gift_addcart", require("./routes/gift_addcart"));

app.use("/api/mark", require("./routes/mark"));
app.use("/api/event", require("./routes/event"));
const port = 3001;
app.listen(port, () => {
  console.log(`server started ${port} - `, new Date());
});
