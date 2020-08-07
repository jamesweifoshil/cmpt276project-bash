var chai = require('chai');
var chaiHttp = require('chai-http');
var server = require('../index').app;
var ioserver = require('http').createServer(server);
var io = require('socket.io')(ioserver);
ioOptions = { 
  transports: ['websocket']
, forceNew: true
, reconnection: false
}

var should = chai.should();
chai.use(chaiHttp);
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
    it('should connect to remote server', (done)=>{ 
        chai.request(server)
            .get('/mainpage')
            .send(user)
            .end((err,res)=>{
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
            '/home/andrey/Downloads/list.c','list.c')
            .attach(user);
        res.should.have.status(204)       
    })  
})