var chai = require('chai');
var fs = require('fs');
var chaiHttp = require('chai-http');
var server = require('../index').app;
var ioConstructor=require('../index').ioConstructor;
var ioserver = require('http').createServer(server);
var io = require('socket.io')(ioserver);
<script src="/socket.io/socket.io.js"></script>
ioConstructor(io);
var socket;
ioOptions = { 
  transports: ['websocket']
, forceNew: true
, reconnection: false
}
var socket;
/*
const bodyParser = require('body-parser');
const initializePassport = require('../passportConfig');
const { pool } = require("../dbConfig");
const session = require('express-session');
const flash = require('express-flash');
const passport = require('passport');
const multiparty = require("multiparty");
var Client = require('ssh2-sftp-client');
initializePassport(passport);
*/
var should = chai.should();
chai.use(chaiHttp);
/*
server.use(passport.initialize());
var sessionParser = session({
    secret:"secret",
    resave: false,
    saveUninitialized: false
  });
server.use(bodyParser.json());
server.use(sessionParser);
server.use(passport.initialize());
server.use(passport.session());
server.use(flash());
*/
const userCredentials= {
    username: 'testlocal', 
    password: '123456'
  }

//authenticate before running any tests below
authenticatedUser = chai.request(server);
before(function(done){
    authenticatedUser
      .post('/login')
      .send(userCredentials)
      .end(function(err, res){
        res.should.have.status(200);
        res.should.redirect;
        done();
      });
  });
  const user = {
    id: 57,
    email: 'testlocal@gmail.com',
    username: 'testlocal',
    password:'$2b$10$r.iuaJQ1S49It9MCaKG3ReN3pK.r1McGOpr6AvNHz255WuxK/oU4i',
    role: 'admin'
  }
describe('Terminal', () => {
  beforeEach(function(done){
    io('http://localhost:5000/', ioOptions)
    done();
  })
    it('should connect to remote server', (done)=>{ 
        socket = io('http://localhost:5000/', ioOptions) 
        chai.request(server)
            .get('/mainpage')
            .send(user)
            .end((err,res)=>{
                //console.log(io);
                res.should.have.status(200);
                done();
            })
    })
    it('Should upload a file', async () => {
       const res = await chai.request(server)
            .post('/terminal')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .field('Content-Type', 'multipart/form-data')
            .field('path','')
            .attach('terminalFile',
            fs.readFileSync('/home/andrey/Downloads/list.c'),'list.c')
            .attach(user);
        res.should.have.status(204)       
    })  
})