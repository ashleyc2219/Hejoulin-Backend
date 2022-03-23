const express = require('express')
const app = express()
const fs = require('fs').promises;
const db = require('./modules/connect-db')
// cors 跨源請求
const cors = require('cors');

// Top-level middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended: false}))

app.get('/', function(req, res) {
    res.send('<p>Hello express</p>')
})
// app.use("/api/product", require("./routes/product"));
app.use("/api/cart-list", require("./routes/cart-list"));
app.use("/api/cart-info", require("./routes/cart-info"));
app.use("/api/cart-order", require("./routes/cart-order"));

const port = 3001;
app.listen(port, ()=>{
    console.log(`server started ${port} - `, new Date())
})