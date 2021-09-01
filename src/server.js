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
  // ('before test');
  Socket.on('test', () => {
    // ('Connected');
  });

  Socket.on('getAllUsers', async () => {
    let result = await Interface.getAllUsers();
    Socket.emit('returnAllUsers', result);
  });

  //---------creating the posts-----------//
  Socket.on('post', async (payload) => {
    try {
      // (payload);
      let created = await Interface.createPost(payload);
      // ('payload of post',payload);
      let friends = await Interface.getFollowing(payload);
      // let allPosts = await Interface.getAllPosts(friends, payload);
      //------declare a new psot has been added to all client-----//
      io.emit('newPost');
    } catch (e) {
      let payload = e;
      Socket.emit('error', payload);
      console.log(e.message);
    }
  });

  Socket.on('groupPost', async (payload) => {
    let createdPost = await Interface.createGroupPost(payload);
    // ('createdPost', createdPost);
    let allGroupPosts = await Interface.allGroupPosts(payload);
    // ('allGroupPosts', allGroupPosts);
    io.to(`group-${payload.groupID}`).emit('returnNewGroupPost', allGroupPosts);
    // io.emit('newGroupPostMade',payload.groupID);
  });

  Socket.on('getAllGroupPosts', async (payload) => {
    // let allGroups = await Interface.getAllGroups(payload);

    // for (let i = 0; i < allGroups.length; i++) {
    //   if (allGroups[i].id !== payload.groupId)
    //     Socket.leave(`group-${allGroups[i].id}`);
    // }
    // Socket.join(`group-${payload.groupId}`);

    let allGroupPosts = await Interface.allGroupPosts(payload);
    let newAllPosts = allGroupPosts.sort((a, b) => {
      if (a.id > b.id) {
        return 1;
      } else if (a.id < b.id) {
        return -1;
      } else {
        return 0;
      }
    });
    // ('allGroupPosts', newAllPosts);
    // let room = `group-${payload.groupId}`;
    Socket.emit('returnNewGroupPost', newAllPosts);
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

  Socket.on('groupComment', async (payload) => {
    let newComment = await Interface.createGroupComment(payload);
    // (newComment);
    let allGroupComments = await Interface.getAllGroupComments();
    io.to(`group-${payload.groupId}`).emit(
      'returnGroupComments',
      allGroupComments
    );
  });

  Socket.on('getAllGroupComments', async () => {
    let allComments = await Interface.getAllGroupComments();
    Socket.emit('returnGroupComments', allComments);
    // ('test',allComments);
  });

  //----gettin all posts to frontEnd----//
  Socket.on('getAllPosts', async (payload) => {
    // ('giting following 123');
    let friends = await Interface.getFollowing(payload);
    // ('friends',friends);
    let allPosts = await Interface.getAllPosts(friends, payload);
    ('before sending the posts:',payload.userID, allPosts);
    let newAllPosts = allPosts.sort((a, b) => {
      if (a.id > b.id) {
        return -1;
      } else if (a.id < b.id) {
        return 1;
      } else {
        return 0;
      }
    });
    console.log(newAllPosts.length);
    Socket.emit('read', newAllPosts);
  });

  //----getting all comment to frontEnd----//
  Socket.on('getAllComments', async (payload) => {
    let allComments = await Interface.getAllComments();
    Socket.emit('readComments', allComments.rows);
  });

  //------making the user profile room------//
  // Socket.on('joinFollowRoom',async(payload)=>{
  //   (payload);
  //   Socket.join(`${payload.reciverId}`);
  // });

  // //-----user joining necessary rooms------//
  //   Socket.on('join',async (payload)=>{
  //     Socket.join(`${payload.userID}`);
  //     let friends = await Interface.getFollowing(payload);
  //     (friends);
  //     for(let i=0;i<friends.length;i++){
  //       Socket.join(`${friends[i].id}`);
  //     }
  //   });

  Socket.on('addFriend', async (data) => {
    // (data);
    let result = await Interface.addFriend(data);
    // (result);
    Socket.emit('friendAdded');
    io.emit('haveBeenFollowed', data.reciverId);
  });

  Socket.on('sendMessage', async (data) => {
    Socket.join(data.messageRoomId);
    // (data);
    let result = await Interface.sendMessage(data);
    let allMessages = await Interface.returnMessages(data.messageRoomId);
    io.in(data.messageRoomId).emit('returnMessages', allMessages);
    // ('All Messages', allMessages);
  });

  Socket.on('returnAllMessages', async (data) => {
    Socket.join(data.messageRoomId);
    // (data);
    // let result = await Interface.sendMessage(data);
    let allMessages = await Interface.returnMessages(data.messageRoomId);
    io.in(data.messageRoomId).emit('returnMessages', allMessages);
    // ('All Returned Messages', allMessages);
  });

  Socket.on('getFollowing', async (data) => {
    // ('data ', data);
    let result = await Interface.getFollowing(data);
    // ('following');
    Socket.emit('returnFollowing', result);
  });

  Socket.on('getFollowers', async (data) => {
    // ('data ', data);
    let result = await Interface.getFollowers(data);
    // (result);
    Socket.emit('returnFollowers', result);
  });

  Socket.on('createGroup', async (data) => {
    // ('data ', data);
    let results = await Interface.createGroup(data);
    // (result);
    io.emit('groupisCreated');
    // (result);
  });

  Socket.on('getAllGroups', async (data) => {
    let result = await Interface.getAllGroups(data);
    // ('returned Groups', result);
    Socket.emit('returnAllGroups', result);
  });

  Socket.on('getGroupRequests', async (data) => {
    // ('data ', data);
    let result = await Interface.getGroupRequests(data);
    // (result);
    Socket.emit('returnGroupRequests', result);
  });

  Socket.on('joinGroup', async (data) => {
    // ('data ', data);
    let result = await Interface.joinGroup(data);
    // (result);
    io.emit('joinGroupRequest', data.owner_id);
  });

  Socket.on('acceptJoinGroup', async (data) => {
    // ('data ', data);
    let result = await Interface.acceptJoinGroup(data);

    // let allMessages = await Interface.returnMessages(data.messageRoomId);
    // io.in(data.groupId).emit('returnPosts', allMessages);
    io.emit('requestAccepted', {
      ownerId: data.ownerId,
      memberId: data.memberId,
    });
    // ('requestAccepted');
  });

  Socket.on('getUsergroups', async (data) => {
    // ('data ', data);
    let result = await Interface.getUsergroups(data);
    console.log('.getUsergroups', result);
    Socket.emit('returnUsergroups', result);
  });

  Socket.on('viewGroup', async (data) => {
    let allGroups = await Interface.getAllGroups(data);

    for (let i = 0; i < allGroups.length; i++) {
      if (allGroups[i].id !== data.groupId)
        Socket.leave(`group-${allGroups[i].id}`);
    }

    Socket.join(`group-${data.groupId}`);
    let result = await Interface.viewGroup(data);
    // (result.group_name);
    let room = `group-${data.groupId}`;
    io.in(room).emit('returnCurrentGroupContent', result);
  });

  Socket.on('getGroupMembers', async (data) => {
    // ('data ', data);
    let result = await Interface.getGroupMembers(data);
    // ('ahmad result', result);
    Socket.emit('returnGroupMembers', result);
  });

  Socket.on('groupPostLike', async (payload) => {
    let newLikes = await Interface.createGroupPostLike(payload);
    Socket.emit('returnGroupLikes', newLikes);
  });

  //----getting target info and sending them to FE----//
  Socket.on('getTargetInfo', async (id) => {
    let target = await Interface.getTargetInfo(id);
    // (target.rows);
    Socket.emit('targetInfo', target.rows);
  });
  //----getting target following---//
  Socket.on('getTargetFollowing', async (payload) => {
    let following = await Interface.getFollowing({ userID: payload });
    Socket.emit('targetFollowing', following);
  });
  //-----getting target followers---//
  Socket.on('getTargetFollowers', async (payload) => {
    let followers = await Interface.getFollowers({ userID: payload });
    Socket.emit('targetFollowers', followers);
  });
  //-----getting target posts----//
  Socket.on('getTargetPosts', async (id) => {
    let targetPosts = await Interface.getTargetPosts(id);
    Socket.emit('targetPosts', targetPosts.rows);
  });
  //-----new users list-----//
  Socket.on('getNewUsersList', () => {
    io.emit('newUsersList');
  });
  //------update like-----//
  Socket.on('like', async (payload) => {
    let likes = await Interface.createLike(payload);
    io.emit('newLike');
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
