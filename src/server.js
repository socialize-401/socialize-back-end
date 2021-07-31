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
const nodemailer = require("nodemailer");
app.use(cors());
app.use(express.json());
app.use(router);
io.listen(server);



function start(port){
    server.listen(port,()=>{
        console.log(`server is up and running at port ${port}`);
    });
}


module.exports={
    start
}