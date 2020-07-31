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

    it('should delete user on post request for /deletUser', function(done){
        // Get num of users before delete
        chai.request(server).get('/getAllUsers').end(function(err, res){
            var numUsersBefore = res.body.length;
            console.log(numUsersBefore);
            // Delete User
            chai.request(server).post('/deleteUser').send(
                {'username':'mochaChaiTest'}
                )
                .end(function(err2,res2){
                    //Get num of users after delete
                    chai.request(server).get('/getAllUsers').end(function(err3, res3){
                        var numUsersAfter = res3.body.length;
                            console.log(numUsersAfter);
                            (numUsersBefore - numUsersAfter).should.equal(1);
                            done();
                    });
            });
        });
    });

    var user = null;
    var userCredentials = {
        username: 'philip13a', 
        password: 'Akukwa.13A'
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

    userCredentials = {
        username: 'admin', 
        password: 'admin12345'
      }

    it("should log in as admin", function(done) {                                                                             
        chai.request(server)
            .post('/login').send(userCredentials)
            .end(function(err, res) {
                res.should.have.status(200);
                res.should.redirect;
                done();
            }); 
        });
});