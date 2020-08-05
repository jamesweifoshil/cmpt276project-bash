
const express = require('express');
const path = require('path');
var app = express();
app.use(express.json());
app.use(express.urlencoded({extended:false}));

const PORT = process.env.PORT || 5000

app.use(express.static(path.join(__dirname, 'public')))
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
var http = require('http');
var server = http.createServer(app);

var io = require('socket.io')(server);
var SSHClient = require('ssh2').Client;




io.on('connection', function(socket) {
  var conn = new SSHClient();
  conn.on('ready', function() {
    socket.emit('data', '\r\n*** SSH CONNECTION ESTABLISHED ***\r\n');
    conn.shell(function(err, stream) {
      if (err)
        return socket.emit('data', '\r\n*** SSH SHELL ERROR: ' + err.message + ' ***\r\n');
      socket.on('data', function(data) {
        stream.write(data);
      });
      stream.on('data', function(d) {
        socket.emit('data', d.toString('binary'));
      }).on('close', function() {
        conn.end();
      });
    });
  }).on('close', function() {
    socket.emit('data', '\r\n*** SSH CONNECTION CLOSED ***\r\n');
  }).on('error', function(err) {
    socket.emit('data', '\r\n*** SSH CONNECTION ERROR: ' + err.message + ' ***\r\n');
  }).connect({
    host: '13.90.229.109',
    port: 22,
    username: 'khoatxp',
    password: 'Cmpt276Bash123@'
  });
});

server.listen(8080);