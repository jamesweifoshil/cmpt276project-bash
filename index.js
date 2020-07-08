const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const path = require('path');
const PORT = process.env.PORT || 5000
var app = express();

const { pool } = require("./dbConfig");
const initializePassport = require('./passportConfig');
const session = require('express-session');
const flash = require('express-flash');
const passport = require('passport');
const bcrypt = require("bcrypt");
initializePassport(passport);

app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({extended:false}));
app.use(
  session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());


app.use(express.static(path.join(__dirname, 'public')))
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
app.get('/', (req, res) => res.render('pages/login'))

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
      callback(null, "./public/fileUploads"); // Destination folder
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

app.get("/register", checkAuthenticated, (req, res)=>{
  res.render("pages/register");
});

app.post("/register", async (req,res)=>{
  let {username, email, password, password2} = req.body;
  console.log({
    username,
    email,
    password,
    password2
  });
  var errors = [];
  if(!username || !email || !password || !password2){
    errors.push({message:"Please enter all fields"});
  }
  if(password.length < 6){
    errors.push({message:"Passwords should be at least 6 characters"});
  }
  if(password != password2){
    errors.push({message:"Passwords do not match"});
  }
  if(errors.length){
    res.render("pages/register",{errors});
  }
  else{
    //Form is now valid, proceed to checking database
    let hashedPassword = await bcrypt.hash(password, 10);

    //Check if email entered is already taken
    let uniqueEmailQuery = 'SELECT * FROM usr WHERE email = $1';
    pool.query(uniqueEmailQuery,[email],(err, result)=>{
      if(err){
        res.end(err);
      }
      console.log(result.rows);
      if(result.rows.length){
        errors.push({message:"Email already taken"});
      }
    });
    //Check if username entered is already taken
    let uniqueUsernameQuery = 'SELECT * FROM usr WHERE username = $1';
    pool.query(uniqueUsernameQuery,[username],(err, result)=>{
      if(err){
        res.end(err);
      }
      console.log(result.rows);
      if(result.rows.length){
        errors.push({message:"Username already taken"});
        res.render("pages/register",{errors});
      }
      else{
        let insertQuery = "INSERT INTO usr (username, email, password) VALUES ($1, $2, $3)"
        pool.query(insertQuery,[username,email,hashedPassword],(err,result)=>{
          if(err){
            res.end(err);
          }
            console.log(result.rows);
          req.flash('success_msg',"You are now registered. Please log in!");
          res.redirect('/login');
        })
      }
    });
  }
});

app.get("/login",checkAuthenticated, (req, res)=>{
  res.render("pages/login");
});

app.post('/login', passport.authenticate("local",{
  successRedirect: "/mainpage",
  session:true,
  failureRedirect: "/login",
  failureFlash: true
}));

function checkAuthenticated(req,res,next){
  if(req.isAuthenticated()){
    return res.redirect('/mainpage');
  }
  next();
}

function checkNotAuthenticated(req,res,next){
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect('/login');
}

app.get("/mainpage",checkNotAuthenticated, (req, res)=>{
  res.render("pages/mainpage", {user: req.user.username});
});

app.get('/logout', (req, res)=>{
  req.logOut();
  req.flash("success_msg", "Logged out succesfully");
  res.redirect('/login');
})

app.listen(PORT, () => console.log(`Listening on ${ PORT }`))
