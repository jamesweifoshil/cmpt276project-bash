const LocalStrategy = require("passport-local").Strategy;
const { pool } = require("./dbConfig");
const bcrypt = require("bcrypt");

function initialize (passport){
  const authenticateUser = (username, password, done) =>{
    let searchUserQuery = 'SELECT * FROM usr WHERE username = $1'
    pool.query(searchUserQuery,[username],(err,result)=>{
      if(err){
        throw err;
      }
      if(result.rows.length){
          const user = result.rows[0];
          bcrypt.compare(password, user.password, (err, isMatch)=>{
            if(err){
              throw err;
            }
            if(isMatch){
              return done(null,user);
            }
            else{
              return done(null, false,{ message: "Password is incorrect"});
            }
          });
      }
      else{
        return done(null, false, {message:"User does not exist"});
      }
    });
  }
  passport.use(
    new LocalStrategy(
      {
        usernameField:"username",
        passwordFiled:"password"
      },
      authenticateUser
    )
  );
  passport.serializeUser((user, done) => done(null,user.id));
  passport.deserializeUser((id, done)=>{
    let searchByUid = 'SELECT * FROM usr WHERE id = $1'
    pool.query(searchByUid, [id], (err, result)=>{
      if(err){
        throw err;
      }
      return done(null, result.rows[0]);
    });
  });
}

module.exports = initialize
