'use strict';
require('dotenv').config();
const pool = require('../../pool.js');

const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const SECRET = process.env.SECRET;

class Interface {
  static create = async (obj) => {
    let sql = `INSERT INTO auth (Email,pass,token) VALUES ($1,$2,$3) RETURNING *;`;
    let sql1 = `INSERT INTO users (firstName,lastName) VALUES ($1,$2) RETURNING *;`;
    let hashedPassword = await bcrypt.hash(obj.pass, 10);
    let token = jwt.sign(
      {
        user: obj.email,
      },
      SECRET,
      {
        expiresIn: '1d',
      }
    );
    let values = [obj.email, hashedPassword, token];
    let values1 = [obj.firstName, obj.lastName];
    await pool.query(sql, values);
    let created = await pool.query(sql1, values1);

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.GMAIL_USER, // generated ethereal user
        pass: process.env.PASSWORD, // generated ethereal password
      },
    });
    let url = `http://localhost:5000/confirmation/${token}`;
    // send mail with defined transport object
    await transporter.sendMail({
      from: '"socialize" <socialize401@gmail.com>', // sender address
      to: `${obj.email}`, // list of receivers
      subject: 'confirm your email to login', // Subject line
      text: 'Hello world?', // plain text body
      html: `<b>confirmation email:</b><br><a href="${url}">${url}</a>`, // html body
    });
    return created;
  };
  static read(email) {
    if (email) {
      let sql = `SELECT * FROM auth WHERE Email=$1;`;
      let value = [email];
      return pool.query(sql, value);
    }
  }
  static verify(email) {
    let sql = `UPDATE auth SET verified=$1 WHERE Email=$2 RETURNING *;`;
    let value = [true, email];
    return pool.query(sql, value);
  }
  static getAllUsers = async () => {
    let sql = `SELECT * FROM users;`;
    let allUsers = await pool.query(sql);
    // console.log(allUsers.rows);
    return allUsers.rows;
  };
  static addFriend = async (data) => {
    let sql = `INSERT INTO friends (receiverid,senderid) VALUES ($1,$2) RETURNING *;`;
    let values = [data.reciverId, data.senderId];
    let addedFriend = await pool.query(sql, values);
    return addedFriend.rows[0];
  };

  static sendMessage = async (data) => {
    let senderSql = `SELECT * FROM users WHERE id=$1;`;
    let senderValues = [data.senderId];
    let senderName = await pool.query(senderSql, senderValues);

    let receiverSql = `SELECT * FROM users WHERE id=$1;`;
    let receiverValues = [data.receiverId];
    let receiverName = await pool.query(receiverSql, receiverValues);

    let sql = `INSERT INTO messages (receiver,sender,content,room,receiver_name,sender_name) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *;`;
    let values = [
      data.receiverId,
      data.senderId,
      data.messageContent,
      data.messageRoomId,
      receiverName.rows[0].firstname,
      senderName.rows[0].firstname,
    ];
    let newMessage = await pool.query(sql, values);
    return newMessage.rows[0];
  };

  static returnMessages = async (room) => {
    let sql = `SELECT * FROM messages WHERE room=$1;`;
    let values = [room];
    let allMessages = await pool.query(sql, values);

    return allMessages.rows;
  };

  static createGroup = async (obj) => {
    // console.log(obj);

    let sql = `INSERT INTO groups (group_name,owner_id,group_description) VALUES ($1,$2,$3) RETURNING *;`;
    let values = [obj.group_name, obj.group_owner, obj.group_description];
    let query = await pool.query(sql, values);

    // console.log(query.rows[0]);
    let data = query.rows[0];

    let sql1 = `INSERT INTO user_groups (group_id,member_id,owner_id,approval_status) VALUES ($1,$2,$3,$4) RETURNING *;`;
    let values1 = [data.id, data.owner_id, data.owner_id, true];
    let joinedGroup = await pool.query(sql1, values1);

    return query.rows[0];
  };

  static getAllGroups = async (data) => {
    let sql = `SELECT * FROM groups WHERE owner_id!=$1;`;
    let values = [data.userID];
    let allGroups = await pool.query(sql, values);

    return allGroups.rows;
  };

  static joinGroup = async (data) => {
    let sql = `INSERT INTO user_groups (group_id,member_id,owner_id) VALUES ($1,$2,$3) RETURNING *;`;
    let values = [data.groupId, data.senderId, data.owner_id];
    let joinedGroup = await pool.query(sql, values);

    return joinedGroup.rows[0];
  };

  static getGroupRequests = async (data) => {
    let sql = `SELECT * FROM user_groups WHERE owner_id=$1 AND approval_status=$2;`;
    let values = [data.userID, false];
    let groupRequests = await pool.query(sql, values);

    console.log(groupRequests.rows);

    let groupsNames = [];
    for (let i = 0; i < groupRequests.rows.length; i++) {
      let tempsql = `SELECT * FROM groups WHERE id=$1;`;
      let tempvalues = [groupRequests.rows[i].group_id];
      let tempdata = await pool.query(tempsql, tempvalues);
      console.log('hi group name', tempdata.rows);
      groupsNames.push(tempdata.rows[0].group_name);
    }

    let membersNames = [];
    for (let i = 0; i < groupRequests.rows.length; i++) {
      let tempsql1 = `SELECT * FROM users WHERE id=$1;`;
      let tempvalues1 = [groupRequests.rows[i].member_id];
      let tempdata1 = await pool.query(tempsql1, tempvalues1);
      console.log('hi group name', tempdata1.rows);
      membersNames.push(
        `${tempdata1.rows[0].firstname} ${tempdata1.rows[0].lastname} `
      );
    }

    let retrnedData = {
      data: groupRequests.rows,
      groupsNames: groupsNames,
      membersNames: membersNames,
    };

    return retrnedData;
  };

  static getUsergroups = async (data) => {
    let sql = `SELECT * FROM user_groups WHERE member_id=$1 AND approval_status=$2;`;
    let values = [data.userID, true];
    let usergroups = await pool.query(sql, values);

    // console.log(usergroups.rows);

    let groupsNames = [];
    for (let i = 0; i < usergroups.rows.length; i++) {
      let tempsql = `SELECT * FROM groups WHERE id=$1;`;
      let tempvalues = [usergroups.rows[i].group_id];
      let tempdata = await pool.query(tempsql, tempvalues);
      // console.log('hi group name', tempdata.rows);
      groupsNames.push(tempdata.rows[0].group_name);
    }

    let retrnedData = {
      data: usergroups.rows,
      groupsNames: groupsNames,
    };

    return retrnedData;
  };

  static viewGroup = async (data) => {
    let sql = `SELECT * FROM groups WHERE id=$1;`;
    let values = [data.groupId];
    let groupData = await pool.query(sql, values);
    return groupData.rows[0];
  };

  static getGroupMembers = async (data) => {
    
    // let sql = `SELECT * FROM user_groups WHERE group_id=$1 AND approval_status=$2;`;
    // let values = [data.groupID, true];
    // let groupData = await pool.query(sql, values);

    // let result = [];
    // for (let i = 0; i < groupData.rows.length; i++) {
    //   let tempsql = `SELECT * FROM users WHERE id=$1;`;
    //   let tempvalues = [groupData.rows[i].member_id];
    //   let tempdata = await pool.query(tempsql, tempvalues);
    //   result.push(tempdata.rows[0]);
    // }
    let sql=`SELECT users.firstname,users.lastname from users INNER JOIN user_groups ON user_groups.member_id=users.id WHERE group_id=$1 AND approval_status=$2;`
    let values = [data.groupID, true];
    let groupData = await pool.query(sql, values);
    return groupData.rows;
  };

  static acceptJoinGroup = async (data) => {
    let sql = `UPDATE user_groups SET approval_status=$1 WHERE member_id=$2 AND group_id=$3 RETURNING *;`;
    let value = [true, data.memberId, data.groupId];

    let result = pool.query(sql, value);
    return result.rows[0];
  };

  static createGroupPost = async (data) => {
    let senderSql = `SELECT * FROM users WHERE id=$1;`;
    let senderValues = [data.userID];
    let senderData = await pool.query(senderSql, senderValues);

    let senderName = `${senderData.rows[0].firstname} ${senderData.rows[0].lastname}`;
    console.log(senderName);

    let sql = `INSERT INTO g_posts (content,g_member_id,g_groups_id,poster_name) VALUES ($1,$2,$3,$4) RETURNING *;`;
    let values = [data.postContent, data.userID, data.groupID, senderName];
    let query = await pool.query(sql, values);
    return query.rows[0];
  };

  static allGroupPosts = async (data) => {
    let sql = `SELECT * FROM g_posts WHERE g_groups_id=$1;`;
    let value = [data.groupID];
    let allGroupPosts = await pool.query(sql, value);

    return allGroupPosts.rows;
  };

  static getFollowing = async (data) => {
    let sql = `SELECT * FROM friends WHERE senderid=$1;`;
    let values = [data.userID];
    let getFollowing = await pool.query(sql, values);

    let result = [];

    for (let i = 0; i < getFollowing.rows.length; i++) {
      let tempsql = `SELECT * FROM users WHERE id=$1;`;
      let tempvalues = [getFollowing.rows[i].receiverid];
      let tempdata = await pool.query(tempsql, tempvalues);
      // console.log('hi', tempdata.rows);
      result.push(tempdata.rows[0]);
    }
    // console.log('result', result);
    return result;
  };

  static getFollowers = async (data) => {
    let sql = `SELECT * FROM friends WHERE receiverid=$1;`;
    let values = [data.userID];
    let getFollowers = await pool.query(sql, values);

    let result = [];

    for (let i = 0; i < getFollowers.rows.length; i++) {
      let tempsql = `SELECT * FROM users WHERE id=$1;`;
      let tempvalues = [getFollowers.rows[i].senderid];
      let tempdata = await pool.query(tempsql, tempvalues);
      // console.log('hi', tempdata.rows);
      result.push(tempdata.rows[0]);
    }
    // console.log('result', result);
    return result;
  };

  static createPost = async (obj) => {
    let sql = `INSERT INTO posts (poster_id,content,poster_name) VALUES ($1,$2,$3) RETURNING *;`;
    let values = [obj.userID, obj.postContent,obj.name];
    let query = await pool.query(sql, values);
    return query;
  };

  static getAllPosts = async (friends, payload) => {
    
    let result = [];
    let sql;
    let value;
    for (let i = 0; i < friends.length; i++) {
      sql = `SELECT * FROM posts WHERE poster_id=$1;`;
      value = [friends[i].id];
      let all = await pool.query(sql, value);
      // console.log(all.rows);

      result = [ ...all.rows];
    }
    // console.log('friends result is: ',result);
    sql = `SELECT * FROM posts WHERE poster_id=$1;`;
    value = [payload.userID];
    let all = await pool.query(sql, value);
    result = [...result, ...all.rows];
    // console.log('all results are: ',result)
    return result;
  };
  static createComment = async (obj) => {
    let sql = `INSERT INTO comments (content,commenter_id,post_id,commenter_name) VALUES ($1,$2,$3,$4) RETURNING *;`;
    let values = [obj.content, obj.userID, obj.post_id,obj.name];
    let query = await pool.query(sql, values);
    return query.rows;
  };

  static createGroupComment = async (obj) => {
    let sequel = `SELECT * FROM users WHERE id=$1;`;
    let tempVal = [obj.userId];
    let readQuery = await pool.query(sequel,tempVal)
    let commenterName = `${readQuery.rows[0].firstname} ${readQuery.rows[0].lastname}`;

    let sql = `INSERT INTO g_comments (content,g_commenter_id,g_post_id,g_commenter_name) VALUES ($1,$2,$3,$4) RETURNING *;`;
    let values = [obj.content, obj.userId, obj.postId, commenterName];
    let query = await pool.query(sql, values);
    return query.rows[0];
  };

  
  static getAllComments = async () => {
    let sql = `SELECT * FROM comments;`;
    let all = await pool.query(sql);
    return all;
  };

  static getAllGroupComments = async () => {
    let sql = `SELECT * FROM g_comments;`;
    let all = await pool.query(sql);
    return all.rows;
  };


  static createLike = async (obj) => {
    let sql = `INSERT INTO likes (liker,post_id) VALUES ($1,$2) RETURNING *;`;
    let values = [obj.userID, obj.post_id];
    let all = await pool.query(sql, values);
    // return all;
  };

  static createGroupPostLike = async (obj) => {
    let sql = `INSERT INTO g_likes (g_liker,g_post_id) VALUES ($1,$2) RETURNING *;`;
    let values = [obj.userId, obj.postId];
    let likes = await pool.query(sql, values);
    return likes.rows;
  };

  static getAllGroupLikes = async (obj) => {
    let sql = `SELECT * FROM g_likes WHERE g_post_id=$1;`;
    let values=[obj.postId]
    let allLikes = await pool.query(sql,values);
    return allLikes.rows;
  };

  static gitAllLikes = async () => {
    let sql = `SELECT * FROM likes;`;
    let allLikes = await pool.query(sql);
    return allLikes.rows;
  };
  static getLikers = async (likesArray) => {
    let likers = [];
    for (let i = 0; i < likesArray.length; i++) {
      let sql = `SELECT * FROM users WHERE id=${likesArray[i].liker};`;
      let liker = await pool.query(sql);
      likers.push(liker.rows[0]);
    }
    // console.log(likers);
  };
  //----getting target profile info from DB----//
  static getTargetInfo = async(id)=>{
    let sql = `SELECT * FROM users WHERE id=$1;`;
    let value = [id];
    return pool.query(sql,value);
  }
  //---getting target posts from DB----//
  static getTargetPosts = async (id)=>{
    let sql = `SELECT * FROM posts WHERE poster_id=$1;`;
    let value=[id];
    return pool.query(sql,value);
  }
}

module.exports = Interface;
