'use strict';
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const app = express();
const server = http.createServer(app);
const io = require('socket.io')(http);
const router = require('./routes/router');
const nodemailer = require('nodemailer');
const { Socket } = require('dgram');
const Interface = require('./models/interface');
const internal = require('stream');

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
io.on('connection', (Socket) => {
  console.log('before test');
  Socket.on('test', () => {
    console.log('Connected');
  });

  Socket.on('getAllUsers', async () => {
    let result = await Interface.getAllUsers();
    Socket.emit('returnAllUsers', result);
  });
  //---------creating the posts-----------//
  Socket.on('post', async (payload) => {
    try {
      await Interface.createPost(payload);
      let allPosts = await Interface.getAllPosts();
      Socket.emit('read', allPosts.rows);
    } catch (e) {
      let payload = e;
      Socket.emit('error', payload);
      console.log(e.message);
    }
  });


  //-------creating comments--------//
  Socket.on('comment', async (payload) => {
    try {
      await Interface.createComment(payload);
      let allComments = await Interface.getAllComments();
      Socket.emit('readComments', allComments.rows);
    } catch (e) {
      let payload = e;
      Socket.emit('error', payload);
      console.log(e.message);
    }
  });


  //----gettin all posts to frontEnd----//
  Socket.on('getAllPosts', async () => {
    let allPosts = await Interface.getAllPosts();
    Socket.emit('read', allPosts.rows);
  });


  //----getting all comment to frontEnd----//
  Socket.on('getAllComments', async () => {
    let allComments = await Interface.getAllComments();
    Socket.emit('readComments', allComments.rows)
  })


  Socket.on('addFriend', async (data) => {
    // console.log(data);
    let result = await Interface.addFriend(data);
    // console.log(result);
  });

  Socket.on('sendMessage', async (data) => {
    Socket.join(data.messageRoomId);
    // console.log(data);
    let result = await Interface.sendMessage(data);
    let allMessages = await Interface.returnMessages(data.messageRoomId);
    io.in(data.messageRoomId).emit('returnMessages', allMessages)
    console.log('All Messages',allMessages);
  });

  Socket.on('getFollowing', async (data) => {
    // console.log('data ', data);
    let result = await Interface.getFollowing(data);
    // console.log(result);
    Socket.emit('returnFollowing', result);
  });

  Socket.on('getFollowers', async (data) => {
    // console.log('data ', data);
    let result = await Interface.getFollowers(data);
    // console.log(result);
    Socket.emit('returnFollowers', result);
  });

  Socket.on('createGroup', async (data) => {
    // console.log('data ', data);
    let result = await Interface.createGroup(data);
    console.log(result);
    // Socket.emit('returnFollowers', result);
  });

  Socket.on('getAllGroups', async () => {
    // console.log('data ', data);
    let result = await Interface.getAllGroups();
    console.log(result);
    Socket.emit('returnAllGroups', result);
  });

  Socket.on('joinGroup', async (data) => {
    // console.log('data ', data);
    let result = await Interface.getAllGroups();
    console.log(result);
    Socket.emit('returnAllGroups', result);
  });
  
  Socket.on('like', async (payload) => {
   await Interface.createLike(payload);
    // console.log(allLikes.rows);
    let allLikes=await Interface.gitAllLikes();
    console.log(allLikes);
    await Interface.getLikers(allLikes);
  });
});

function start(port) {
  server.listen(port, () => {
    console.log(`server is up and running at port ${port}`);
  });
}

module.exports = {
  start,
};
