const express = require('express');
const multer = require('multer');
const aws = require('aws-sdk');
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

app.get('/', (req, res) => res.render('pages/welcome'))


/*
* Configure the AWS region of the target bucket.
* Remember to change this to the relevant region.
*/
  aws.config.region = 'us-west-2';

/*
* Load the S3 information from the environment variables.
*/
const S3_BUCKET = process.env.S3_BUCKET;

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

/*
 * Respond to GET requests to /fileUpload.
 * Upon request, render the 'fileUpload' web page in views/ directory.
 */
app.get('/fileUpload', checkNotAuthenticated,(req, res) => res.render('pages/fileUpload'));

/*
 * Respond to GET requests to /sign-s3.
 * Upon request, return JSON containing the temporarily-signed S3 request and
 * the anticipated URL of the image.
 */
app.get('/sign-s3', (req, res) => {
  const s3 = new aws.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  });
  const fileName = req.query['file-name'];
  const fileType = req.query['file-type'];
  const s3Params = {
    Bucket: S3_BUCKET,
    Key: fileName,
    Expires: 60,
    ContentType: fileType,
    ACL: 'public-read'
  };

  s3.getSignedUrl('putObject', s3Params, (err, data) => {
    if(err){
      console.log(err);
      return res.end();
    }
    const returnData = {
      signedRequest: data,
      url: `https://${S3_BUCKET}.s3.amazonaws.com/${fileName}`
    };
    res.write(JSON.stringify(returnData));
    res.end();
  });
});

app.post('/save-details', (req, res) => {
  // TODO: Read POSTed form data and do something useful
});

/*
 * Respond to GET requests to /register
 */
app.get("/register", checkAuthenticated, (req, res)=>{
  res.render("pages/register");
});


/*
 * POST request to database with user registration data
 */
app.post("/register", async (req,res)=>{
  let {username, email, password, password2} = req.body;
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
          req.flash('success_msg',"You are now registered. Please log in!");
          res.redirect('/login');
        })
      }
    });
  }
});

/*
 * Respond to GET requests to /login
 */
app.get("/login",checkAuthenticated, (req, res)=>{
  res.render("pages/login");
});

/*
 * Authenticate login
 */
app.post('/login', passport.authenticate("local",{
  successRedirect: "/mainpage",
  session:true,
  failureRedirect: "/login",
  failureFlash: true
}));

/*
 * Redirect to /fileUpload.html
 */
app.post('/fileUpload', function(req, res) {
  res.redirect('/fileUpload.html');
});

function checkAuthenticated(req,res,next){
  if(req.isAuthenticated()){
    return res.redirect('/mainpage');
  }
  next();
}

/*
 * Redirect to login in authentication fails
 */
function checkNotAuthenticated(req,res,next){
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect('/login');
}

/*
 * Redirect to landing page if login is successful
 */
app.get("/mainpage",checkNotAuthenticated, (req, res)=>{
  res.render("pages/mainpage", {user: req.user.username});
});

app.get('/logout', (req, res)=>{
  req.logOut();
  req.flash("success_msg", "Logged out succesfully");
  res.redirect('/login');
})

app.listen(PORT, () => console.log(`Listening on ${ PORT }`))
