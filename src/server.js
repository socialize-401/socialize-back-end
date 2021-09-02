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
      let created = await Interface.createPost(payload);
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
    let allGroupPosts = await Interface.allGroupPosts(payload);
    io.to(`group-${payload.groupID}`).emit('returnNewGroupPost', allGroupPosts);
  });

  Socket.on('getAllGroupPosts', async (payload) => {
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
    let allGroupComments = await Interface.getAllGroupComments();
    io.to(`group-${payload.groupId}`).emit(
      'returnGroupComments',
      allGroupComments
    );
  });

  Socket.on('getAllGroupComments', async () => {
    let allComments = await Interface.getAllGroupComments();
    Socket.emit('returnGroupComments', allComments);
  });

  //----gettin all posts to frontEnd----//
  Socket.on('getAllPosts', async (payload) => {
    let friends = await Interface.getFollowing(payload);
    let allPosts = await Interface.getAllPosts(friends, payload);
    'before sending the posts:', payload.userID, allPosts;
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
  Socket.on('addFriend', async (data) => {
    let result = await Interface.addFriend(data);
    Socket.emit('friendAdded');
    io.emit('haveBeenFollowed', data.reciverId);
  });

  Socket.on('sendMessage', async (data) => {
    Socket.join(data.messageRoomId);
    let result = await Interface.sendMessage(data);
    let allMessages = await Interface.returnMessages(data.messageRoomId);
    io.in(data.messageRoomId).emit('returnMessages', allMessages);
  });

  Socket.on('returnAllMessages', async (data) => {
    Socket.join(data.messageRoomId);
    let allMessages = await Interface.returnMessages(data.messageRoomId);
    io.in(data.messageRoomId).emit('returnMessages', allMessages);
  });

  Socket.on('getFollowing', async (data) => {
    let result = await Interface.getFollowing(data);
    Socket.emit('returnFollowing', result);
  });

  Socket.on('getFollowers', async (data) => {
    let result = await Interface.getFollowers(data);
    Socket.emit('returnFollowers', result);
  });

  Socket.on('createGroup', async (data) => {
    let results = await Interface.createGroup(data);
    io.emit('groupisCreated');
  });

  Socket.on('getAllGroups', async (data) => {
    let result = await Interface.getAllGroups(data);
    Socket.emit('returnAllGroups', result);
  });

  Socket.on('getGroupRequests', async (data) => {
    let result = await Interface.getGroupRequests(data);
    Socket.emit('returnGroupRequests', result);
  });

  Socket.on('joinGroup', async (data) => {
    let result = await Interface.joinGroup(data);
    io.emit('joinGroupRequest', data.owner_id);
  });

  Socket.on('acceptJoinGroup', async (data) => {
    let result = await Interface.acceptJoinGroup(data);

    io.emit('requestAccepted', {
      ownerId: data.ownerId,
      memberId: data.memberId,
    });
  });

  Socket.on('getUsergroups', async (data) => {
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
    let room = `group-${data.groupId}`;
    io.in(room).emit('returnCurrentGroupContent', result);
  });

  Socket.on('getGroupMembers', async (data) => {
    let result = await Interface.getGroupMembers(data);
    Socket.emit('returnGroupMembers', result);
  });

  Socket.on('groupPostLike', async (payload) => {
    let newLikes = await Interface.createGroupPostLike(payload);
    Socket.emit('returnGroupLikes', newLikes);
  });

  //----getting target info and sending them to FE----//
  Socket.on('getTargetInfo', async (id) => {
    let target = await Interface.getTargetInfo(id);
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
