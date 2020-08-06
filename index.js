const express = require('express');
const multer = require('multer');
const aws = require('aws-sdk');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const { pool } = require("./dbConfig");
const initializePassport = require('./passportConfig');
const session = require('express-session');
const flash = require('express-flash');
const passport = require('passport');
const bcrypt = require("bcrypt");
const multiparty = require("multiparty");
var Client = require('ssh2-sftp-client');

initializePassport(passport);

var sessionParser = session({
  secret:"secret",
  resave: false,
  saveUninitialized: false
});

var app = express();
app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({extended:false}));
app.use(sessionParser);
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
const PORT = process.env.PORT || 5000

app.use(express.static(path.join(__dirname, 'public')))
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')


var Connection = require('ssh2');
var http = require('http');
var server = http.createServer(app);
var io = require('socket.io')(server);
io.use(function(socket, next){
    // Wrap the express middleware
    sessionParser(socket.request, {}, next);
})
server.listen(PORT);




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
var conn = new Connection();
app.get("/register", checkAuthenticated, (req, res)=>{
  res.render("pages/register");
  conn.connect({
    host:'13.90.229.109',
    port: 22,
    username:'khoatxp',
    password:'Cmpt276Bash123@'
});
});

/*
 * executeCommand function helps prevent concurrent commands sent to remote server
 * is used with setTimeOut
 */

function executeCommand(command){
  conn.exec(command, (err, stream) => {
    if (err) {
      console.error(err)
    } else {
      stream.on('data',function(data){
        console.log("STDOUT: "+data);
      });
      stream.stderr.on('data',data=>{
        console.log("STDERR: "+data);
      })
    }
  });
}
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
          
          //Automatically add username to remote Linux server with home directory and password
          let command = "sudo adduser --quiet --disabled-password --shell /bin/bash --home /home/"+username+" --gecos \"User\" "+username;
          
          conn.exec(command, (err, stream) => {
            if (err) {
              console.error(err)
            } else {
              stream.on('data',function(data){
                console.log("STDOUT: "+data);
              });
              stream.stderr.on('data',data=>{
                console.log("STDERR: "+data);
              })
            }
          });
          setTimeout(executeCommand,4000,"echo '"+username+":"+hashedPassword+"' | sudo chpasswd");
          //conn.end();
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
  //conn.end();
 // req.session.destroy();
  //res.clearCookie();
  res.redirect('/login');
})

app.get('/db', checkNotAuthenticated, checkRole('admin'), nocache, (req, res)=>{
  let getUserQuery = 'SELECT * FROM usr WHERE role <> \'admin\';';
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
    conn.connect({
      host:'13.90.229.109',
      port: 22,
      username:'khoatxp',
      password:'Cmpt276Bash123@'
  });
  });
});

app.post('/delete-user/:id',(req,res)=>{
  var id = req.params.id;
  var getUserQuery = "SELECT * FROM usr WHERE id = $1";
  var deleteUserQuery = 'DELETE FROM usr WHERE id = $1';
  pool.query(getUserQuery,[id],(error, result)=>{
    if(error){
      res.end(error);
    }
    var usrname = result.rows[0].username;
    pool.query(deleteUserQuery,[id],(error,result)=>{
      if(error){
        res.end(error);
      }
      conn.exec('sudo deluser --remove-home '+usrname, (err, stream) => {
        if (err) {
          console.error(err)
        } else {
          stream.on('data',function(data){
            console.log("STDOUT: "+data);
          });
          stream.stderr.on('data',data=>{
            console.log("STDERR: "+data);
          })
        }
      });
      res.redirect('/db');
    })
  });

})

app.post('/saveEditorText', (req,res)=> {
  var textEditorArray = req.body.textEditorArray
})

app.post('/terminal',(req,res)=>{
  //Use multiparty to parse the choose file form
  var form = new multiparty.Form();
  form.parse(req, (err,fields,files)=>{
    if(err){
      res.end(err);
    }
    if(fields.path && fields.path[fields.path.length-1]!=='/'){
      fields.path+='/';
    }
    console.log(fields.path);
    if(files.terminalFile[0].size){
      var sftp = new Client();
      sftp.connect({
        host: '13.90.229.109',
        port: 22,
        username: req.user.username,
        password: req.user.password
      },'once')
      .then(()=>{
        files.terminalFile.forEach(element => {
          sftp.fastPut(element.path,'/home/'+req.user.username+'/'+fields.path+element.originalFilename,{}).then(()=>{
        }).catch((err)=>{
            sftp.end();
            console.log(err,'fastPut method error');
          })
        })
      }).catch((err)=>{
        sftp.end();
        console.log(err,'connect method error');
      });
    } 
  });
  res.status(204).send();
})

app.post('/downloadFile', (req, res) => {
  
  if(req.body.path && req.body.path[req.body.path.length-1]!=='/'){
    req.body.path+='/';
  }
  const remotePath = req.body.path+ req.body.fileName;
  const localPath = path.join(process.env.HOME || process.env.USERPROFILE, 'Downloads/' + req.body.fileName);
  var sftp = new Client();
  sftp.connect({
      host: '13.90.229.109',
      port: 22,
      username: req.user.username,
      password: req.user.password
  },'once')
    .then(() => {
      sftp.fastGet(remotePath, localPath, {}).then(() => {
          sftp.end();
      }).catch((err) => {
          sftp.end();
          console.log(err, 'fastGet method error');
      })
  }).catch((err) => {
      sftp.end();
      console.log(err, 'connect method error');
  });
  res.status(204).send();
});


//open socket to receive commands and send output to front-end
io.on('connection', function(socket) {
    var sshConnection = new Connection(); 
    if(socket.request.session.passport){
    var getUserQuery = "SELECT * FROM usr WHERE id = $1";
    pool.query(getUserQuery,[socket.request.session.passport.user],(error, result)=>{
      if(error){
        res.end(error);
      }

      sshConnection.connect({    
        host: '13.90.229.109',
        port: 22,
        username: result.rows[0].username,
        password: result.rows[0].password
      })
    })
  }
    sshConnection.on('ready', function() {
      socket.emit('data', '\r\n*** SSH CONNECTION ESTABLISHED ***\r\n');
      sshConnection.shell(function(err, stream) {
        if (err)
          return socket.emit('data', '\r\n*** SSH SHELL ERROR: ' + err.message + ' ***\r\n');
        socket.on('data', function(data) {
          stream.write(data);
        });
        stream.on('data', function(d) {
          socket.emit('data', d.toString('binary'));
        }).on('close', function() {
          sshConnection.end();
        });
      });
    }).on('close', function() {
      socket.emit('data', '\r\n*** SSH CONNECTION CLOSED ***\r\n');
    }).on('error', function(err) {
      socket.emit('data', '\r\n*** SSH CONNECTION ERROR: ' + err.message + ' ***\r\n');
    })
  });