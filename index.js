const express = require('express');
const multer = require('multer');
const aws = require('aws-sdk');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const PORT = process.env.PORT || 5000
const { exec } = require('child_process');
const { pool } = require("./dbConfig");
const initializePassport = require('./passportConfig');
const session = require('express-session');
const flash = require('express-flash');
const passport = require('passport');
const bcrypt = require("bcrypt");
'use strict';
initializePassport(passport);



var app = express();
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


/*
//Testing
///////////////////////////

const Terminal = require("./public/script/terminal.class.js");
let terminalServer = new Terminal({
    role: "server",
    shell: (process.platform === "win32") ? "cmd.exe" : "bash",
    port: 3000
});

terminalServer.onclosed = (code, signal) => {
    console.log("Terminal closed - "+code+", "+signal);
    app.quit();
};
terminalServer.onopened = () => {
    console.log("Connected to remote");
};
terminalServer.onresized = (cols, rows) => {
    console.log("Resized terminal to "+cols+"x"+rows);
};
terminalServer.ondisconnected = () => {
    console.log("Remote disconnected");
};

//////////////////////////////////////
*/



var Connection = require('ssh2');
var conn = new Connection();
var http = require('http');


//open socket to receive commands and send output to front-end
const WebSocket = require('ws')
const wss = new WebSocket.Server({ port: 8080 })
var server = http.Server(app);
var ssh2ConnectionControl = false;

if(!ssh2ConnectionControl)
  {
    conn.connect({
      host:'13.90.229.109',
      port: 22,
      username:'khoatxp',
      password:'Cmpt276Bash123@'
    });
    ssh2ConnectionControl=true;
  }
wss.on('connection', ws => {
  
  ws.on('message', message => {
    console.log(`Received message => ${message}`)
    conn.exec(message, (err, stream) => {
      if (err) {
        console.error(err)
      } else {
      stream.on('data',function(data){
        console.log("STDOUT: "+data);
        ws.send(data+"");
      });
      stream.stderr.on('data',data=>{
        console.log("STDERR: "+data);
      })
     // ws.send(message.utf8Data);
      // ws.send(stderr);
      }
    });
      
      
      
    
  });  
    
       
   
    
//    ssh2_scp_send($resource_connection, 'C:/Users/chopr/Desktop/cmpt276/assignment second/index.js', '/home/khoatxp', 0644);
    
})





  
 
    // Example of using the uploadDir() method to upload a directory
    // to a remote SFTP server
 
    
    const SftpClient = require('ssh2-sftp-client');
 
    const dotenvPath = path.join(__dirname, '..', '.env');
    require('dotenv').config({path: dotenvPath});
 
    const config = {
        host:'13.90.229.109',
        username:'khoatxp',
        password:'Cmpt276Bash123@',
        port: 22
    };
 
    async function main() {
const client = new SftpClient('upload-test');
const src = path.join('C:/Users/chopr/Desktop/upload');
const dst = '/home/khoatxp';
 //'C:\Users\chopr\Desktop', '..', './hello'
try {
  await client.connect(config);
  client.on('upload', info => {
    console.log(`Listener: Uploaded ${info.source}`);
  });
  let rslt = await client.uploadDir(src, dst);
  return rslt;
} finally {
  client.end();
}
    }
 
    main()
.then(msg => {
  console.log(msg);
})
.catch(err => {
  console.log(`main error: ${err.message}`);
});




/*
* Prevent user from going back action in the browser after logging out
*/
function nocache(req, res, next) {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');
  next();
}

/*
*Check role before enter administator right web pages
*/
function checkRole(role){
  return (req, res, next) =>{
    if(req.user.role !== role){
      res.status(401);
      return res.send('Not allowed');
    }
    next();
  }
}

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
* Configure the AWS region of the target bucket.
* Remember to change this to the relevant region.
*/
  aws.config.region = 'us-west-2';

/*
* Load the S3 information from the environment variables.
*/
const S3_BUCKET = process.env.S3_BUCKET;




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

app.get('/', (req, res) => res.render('pages/welcome'))

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
 app.post('/login',
 passport.authenticate('local', {
     successRedirect: '/mainpage',
     failureRedirect: '/login',
     failureFlash: true
 })
);

app.get("/admin",checkNotAuthenticated, checkRole('admin'), nocache, (req, res)=>{
  res.render("pages/admin");
});

/*
 * Respond to GET requests to /fileUpload.
 * Upon request, render the 'fileUpload' web page in views/ directory.
 */
app.get('/fileUpload', checkNotAuthenticated, nocache, (req, res) => res.render('pages/fileUpload'));

/*
 * Redirect to /fileUpload
 */
app.post('/fileUpload', function(req, res) {
  res.redirect('pages/fileUpload');
});

app.get('/demo', function(req, res) {
  res.render('pages/demo');
});
/*
 * Redirect to landing page if login is successful
 */
app.get("/mainpage",checkNotAuthenticated,nocache, (req, res)=>{
  res.render("pages/mainpage", {user: req.user});
});

app.get('/logout', (req, res)=>{
  req.logOut();
  req.flash("success_msg", "Logged out succesfully");
  res.redirect('/login');
})

app.get('/db', checkNotAuthenticated, checkRole('admin'), nocache, (req, res)=>{
  let getUserQuery = 'SELECT * FROM usr WHERE username <> \'admin\';';
  pool.query(getUserQuery,(error, result)=>{
    if(error)
      res.end(error);
    let results = {'rows':result.rows};
    res.render('pages/db', results);
  });
});

app.get('/view-user/:id', checkNotAuthenticated, checkRole('admin'), nocache, (req,res)=>{
  var id = req.params.id;
  var getUserQuery = "SELECT * FROM usr WHERE id = $1";
  pool.query(getUserQuery,[id],(error, result)=>{
    if(error){
      res.end(error);
    }
    var results = {'rows':result.rows[0]};
    res.render('pages/view-user', results);
  });
});

app.post('/delete-user/:id',(req,res)=>{
  var id = req.params.id;
  var deleteUserQuery = 'DELETE FROM usr WHERE id = $1';
  pool.query(deleteUserQuery,[id],(error,result)=>{
    if(error){
      res.end(error);
    }
    res.redirect('/db');
  })
})

app.post('/saveEditorText', (req,res)=> {
  var textEditorArray = req.body.textEditorArray
})






app.listen(PORT, () => console.log(`Listening on ${ PORT }`))
