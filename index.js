const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000

const { Pool } = require('pg');
const pool = new Pool({
   connectionString: process.env.DATABASE_URL
});

var app = express();
app.use(express.json());
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
app.listen(PORT, () => console.log(`Listening on ${ PORT }`))


