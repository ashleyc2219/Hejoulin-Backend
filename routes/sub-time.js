var express = require("express");
const res = require("express/lib/response");
var router = express.Router();
const db = require("../modules/connect-db");

router.get('/subtime', async(req, res)=>{
    const sql = "SELECT * FROM `sub_plan`";
    
})