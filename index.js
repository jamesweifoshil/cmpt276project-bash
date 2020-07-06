const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const path = require('path');
const PORT = process.env.PORT || 5000

const { Pool } = require('pg');
const pool = new Pool({
   connectionString: process.env.DATABASE_URL
});

var app = express();
app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({extended:false}));
app.use(express.static(path.join(__dirname, 'public')))
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
app.get('/', (req, res) => res.render('pages/index'))

/*
  create table usr (uid char(10) NOT NULL, username char(50) NOT NULL, password char(255) NOT NULL, email char(100) NOT NULL);
            ____________________________________________
      usr:  |uid | username  | password  | email        |
            --------------------------------------------
test entry: |1   | test      | test      | test@test.com|
            _____________________________________________
*/
app.get('/database', (req, res) => {
  var getUsersQuery = `SELECT * FROM usr`;
  pool.query(getUsersQuery, (error, result) => {
     if (error) {
       res.end(error);
     }
     var results = {'rows':result.rows};
     res.render('pages/db', results);
  })
})

var Storage = multer.diskStorage({
  destination: function(req, file, callback) {
      callback(null, "./Images");
  },
  filename: function(req, file, callback) {
      callback(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
  }
});


/*  All fiels contain the following metadata:
    - fieldname: Field name specified in the form.
    - originalname: Name of the file on the user’s computer.
    - encoding: Encoding type of the file.
    - mimetype: Mime type of the file.
    - size: Size of the file in bytes.
    - destination: The folder to which the file has been saved.
    - filename: The name of the file in the destination.
    - path: The full path to the uploaded file.
    - buffer: A Buffer of the entire file.
*/

var Storage = multer.diskStorage({
  destination: function(req, file, callback) {
      callback(null, "./fileUploads");
  },
  filename: function(req, file, callback) {
      callback(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
  }
});

var upload = multer({
  storage: Storage
}).array("imgUploader", 3); //Field name and max count

app.get("/", function(req, res) {
  res.sendFile(__dirname + "/fileUplaod.html");
});
app.post("/api/Upload", function(req, res) {
  upload(req, res, function(err) {
      if (err) {
          return res.end("Something went wrong!");
      }
      return res.end("File uploaded sucessfully!.");
  });
});

app.listen(PORT, () => console.log(`Listening on ${ PORT }`))


