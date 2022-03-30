// const multer = require("multer");
// const { v4: uuidv4 } = require("uuid");
// //const {detectMimeType} = require("nodemailer/lib/mime-funcs");

// //key寫標準mimetype,value自己取名
// const extMap = {
//   "image/jpeg": ".jpg",
//   "image/png": ".png",
//   "image/gif": ".gif",
// };

// //cb:callback function 如果是ture代表此檔案是要的//第一個參數是丟錯誤,沒有錯誤丟空值
// const storage = multer.diskStorage({
//   //整個用戶都看得到,要做分層要處理session //檔案要放哪裡
//   destination: (req, file, cb) => {
//     cb(null, __dirname + "/../public/images/mark_pic");
//   },
//   //檔名要叫什麼
//   filename: (req, file, cb) => {
//     let ext = extMap[file.mimetype];
//     cb(null, uuidv4() + ext);
//   },
// });

// //先進到這篩選
// //呼叫cb,第一個參數是丟錯誤,沒有錯誤丟空值
// //!!轉換成布林值;字串只要有內容就是ture
// const fileFilter = (req, file, cb) => {
//   cb(null, !!extMap[file.mimetype]);
// };

// module.exports = multer({ storage, fileFilter });

const multer = require("multer");
const { v4: uuidv4 } = require("uuid");

const extMap = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
};

const fileFilter = (req, file, cb) => {
  cb(null, !!extMap[file.mimetype]);
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, __dirname + "/../public/images/mark_pic");
  },
  filename: (req, file, cb) => {
    cb(null, uuidv4() + extMap[file.mimetype]);
  },
});

module.exports = multer({ fileFilter, storage });
