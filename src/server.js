'use strict';
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const app = express();
const server = http.createServer(app);
const io = require('socket.io')(http);
const router = require('./routes/router');
const Interface = require('./models/interface');

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
  // console.log('before test');
  Socket.on('test', () => {
    // console.log('Connected');
  });

  Socket.on('getAllUsers', async () => {
    let result = await Interface.getAllUsers();
    Socket.broadcast.emit('returnAllUsers', result);
  });

  //---------creating the posts-----------//
  Socket.on('post', async (payload) => {
    try {
      // console.log(payload);
      let created = await Interface.createPost(payload);
      // console.log('payload of post',payload);
      let friends = await Interface.getFollowing(payload);
      let allPosts = await Interface.getAllPosts(friends, payload);
      //------declare a new psot has been added to all client-----//
      io.emit('newPost');
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
  Socket.on('getAllPosts', async (payload) => {
    console.log('giting following 123');
    let friends = await Interface.getFollowing(payload);
    console.log('friends 123', friends);
    let allPosts = await Interface.getAllPosts(friends, payload);
    console.log('before sending the posts:', allPosts);
    Socket.emit('read', allPosts);
  });

  //----getting all comment to frontEnd----//
  Socket.on('getAllComments', async (payload) => {
    let allComments = await Interface.getAllComments();
    Socket.emit('readComments', allComments.rows);
  });

  //------making the user profile room------//
  // Socket.on('joinFollowRoom',async(payload)=>{
  //   console.log(payload);
  //   Socket.join(`${payload.reciverId}`);
  // });

  // //-----user joining necessary rooms------//
  //   Socket.on('join',async (payload)=>{
  //     Socket.join(`${payload.userID}`);
  //     let friends = await Interface.getFollowing(payload);
  //     console.log(friends);
  //     for(let i=0;i<friends.length;i++){
  //       Socket.join(`${friends[i].id}`);
  //     }
  //   });

  Socket.on('addFriend', async (data) => {
    // console.log(data);
    let result = await Interface.addFriend(data);
    Socket.emit('friendAdded');
    // console.log(result);
  });

  Socket.on('sendMessage', async (data) => {
    Socket.join(data.messageRoomId);
    // console.log(data);
    let result = await Interface.sendMessage(data);
    let allMessages = await Interface.returnMessages(data.messageRoomId);
    io.in(data.messageRoomId).emit('returnMessages', allMessages);
    // console.log('All Messages', allMessages);
  });

  Socket.on('getFollowing', async (data) => {
    // console.log('data ', data);
    let result = await Interface.getFollowing(data);
    // console.log('following');
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
    // console.log(result);
  });

  Socket.on('getAllGroups', async () => {
    // console.log('data ', data);
    let result = await Interface.getAllGroups();
    // console.log(result);
    Socket.emit('returnAllGroups', result);
  });

  Socket.on('getGroupRequests', async (data) => {
    // console.log('data ', data);
    let result = await Interface.getGroupRequests(data);
    // console.log(result);
    Socket.emit('returnGroupRequests', result);
  });

  Socket.on('joinGroup', async (data) => {
    // console.log('data ', data);
    let result = await Interface.joinGroup(data);
    // console.log(result);
  });

  Socket.on('acceptJoinGroup', async (data) => {
    // console.log('data ', data);
    let result = await Interface.acceptJoinGroup(data);

    // let allMessages = await Interface.returnMessages(data.messageRoomId);
    // io.in(data.groupId).emit('returnPosts', allMessages);

    // console.log(result);
  });

  Socket.on('getUsergroups', async (data) => {
    // console.log('data ', data);
    let result = await Interface.getUsergroups(data);
    console.log(result);
    Socket.emit('returnUsergroups', result);
  });

  Socket.on('viewGroup', async (data) => {
    // console.log('data ', data);
    Socket.join(`group-${data.groupId}`);
    let result = await Interface.viewGroup(data);
    console.log(result.group_name);
    Socket.emit('returnCurrentGroupContent', result);
  });

  Socket.on('like', async (payload) => {
    await Interface.createLike(payload);
    // console.log(allLikes.rows);
    let allLikes = await Interface.gitAllLikes();
    // console.log(allLikes);
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
