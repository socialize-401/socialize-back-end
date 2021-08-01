'use strict';
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const app = express();
const server = http.createServer(app);
const io = require('socket.io')(http);
const uuid = require('uuid').v4;
const router = require('./routes/router');
const nodemailer = require('nodemailer');
const { Socket } = require('dgram');

app.use(cors());

// app.all('http://localhost:3000', function (req, res, next) {
//   res.header('Access-Control-Allow-Origin', '*');
//   res.header(
//     'Access-Control-Allow-Headers',
//     'http://localhost:3000/-Requested-With-http://localhost:5000/signin'
//   );
//   next();
// });

app.use(express.json());
app.use(router);
io.listen(server);
io.on('connection',(Socket)=>{
  Socket.on('test',(data)=> {
    
      console.log('true ...');
    
  })
})



function start(port) {
  server.listen(port, () => {
    console.log(`server is up and running at port ${port}`);
  });
}

module.exports = {
  start,
};
