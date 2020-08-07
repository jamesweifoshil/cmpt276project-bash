var chai = require('chai');
var chaiHttp = require('chai-http');
var server = require('../index');
var should = chai.should();

chai.use(chaiHttp);

describe('Users', function() {
    //Tests assciated with users
    it('should add single user on post request for /register', function(done){
        chai.request(server).get('/getAllUsers').end(function(err, res){
            var numUsersBefore = res.body.length;
            console.log(numUsersBefore);
            chai.request(server).post('/register').send(
                {'email':'mochaChaiTest@test.com','username':'mochaChaiTest','password':'mochaChaiTest','password2':'mochaChaiTest'}
                )
                .end(function(err2,res2){
                    res2.should.have.status(200);
                    chai.request(server).get('/getAllUsers').end(function(err3, res3){
                        var numUsersAfter = res3.body.length;
                            console.log(numUsersAfter);
                            (numUsersAfter - numUsersBefore).should.equal(1);
                            done();
                    });
            });
        });
    });

    var user = null;
    var userCredentials = {
        username: 'philip13a',
        password: 'Akukwa.13A',
        role: 'user'
      }

    it("should log in as user philip13a", function(done) {
    chai.request(server)
        .post('/login').send(userCredentials)
        .end(function(err, res) {
            res.should.have.status(200);
            res.should.redirect;
            done();
        });
    });

    it("user cannot login as admin", (done)=>{

        chai.request(server)
            .post('/admin').send(userCredentials)
            .end(function(err, res) {
                res.should.have.status(404);
                done();
            });
    })

    it("user login and logout", (done)=>{

        chai.request(server)
        .post('/login').send(userCredentials)
        .end(function(err, res) {
            res.should.have.status(200);
                res.should.redirect;

    });
    chai.request(server)
        .post('/logout').send(userCredentials)
        .end(function(err, res) {
            res.should.have.status(404);
                done();
        });
    });
  });

describe('admin', function(){

    userCredentials = {
        username: 'admin',
        password: 'admin',
        role: 'admin'
      }
    it("admin login", (done)=>{

        chai.request(server)
        .get('/admin').send(userCredentials)
        .end(function(err, res) {
            res.should.have.status(200);
            done();

        });

    });

    it("admin access database", (done)=>{

        chai.request(server)
        .get('/admin').send(userCredentials)
        .end(function(err, res) {
            res.should.have.status(200);

            chai.request(server)
            .get('/db').send(userCredentials)
            .end(function(err,res2){
                res2.should.have.status(200);
                done();
            });
        });
    });

    it("admin access user by id", (done)=>{

        const id=1;
        chai.request(server)
        .get('/admin').send(userCredentials)
        .end(function(err, res) {
            res.should.have.status(200);

            chai.request(server)
            .get('/view-user/'+id).send(userCredentials)
            .end(function(err,res2){
                res2.should.have.status(200);
                done();
            });
        });
    });

    it("admin delete user by id", (done)=>{

          const id=1;
          chai.request(server)
          .get('/admin').send(userCredentials)
          .end(function(err, res) {
              res.should.have.status(200);

              chai.request(server)
              .post('/delete-user/'+id).send(userCredentials)
              .end(function(err,res2){
                  res2.should.have.status(200);
                  done();
              });
          });
      });
});

after(function (done){

          var id = 1;
          chai.request(server)
          .get('/admin').send(userCredentials)
          .end(function(err, res) {
              res.should.have.status(200);

              chai.request(server)
              .post('/delete-user/:id'+id).send(userCredentials)
              .end(function(err,res2){
                  res2.should.have.status(200);
                  done();
              });
          });
      });


// describe('general ui testing', function(){

//     userCredentials = {
//         username: '',
//         password: '',
//         role: ""
//       }

//       it("file upload without any info", (done)=>{

//         chai.request(server)
//         .post('/fileUpload').send(userCredentials)
//         .end(function(err, res) {
//             res.should.have.status(404);
//             done();

//         })

//     })














// })
