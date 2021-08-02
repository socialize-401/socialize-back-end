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
    let sql = `INSERT INTO posts (poster_id,content) VALUES ($1,$2) RETURNING *;`;
    let values = [obj.userID, obj.postContent]
    let query = await pool.query(sql, values);
    return query;
  }
  static getAllPosts = async () => {
    let sql = `SELECT * FROM posts;`;
    let all = await pool.query(sql);
    return all;
  }
  static createComment = async (obj) => {
    let sql = `INSERT INTO comments (content,commenter_id,post_id) VALUES ($1,$2,$3) RETURNING *;`;
    let values = [obj.content, obj.userID, obj.post_id]
    let query = await pool.query(sql, values);
    return query.rows;
  }
  static getAllComments = async () => {
    let sql = `SELECT * FROM comments;`;
    let all = await pool.query(sql);
    return all
  }
  static createLike = async (obj) => {
    let sql = `INSERT INTO likes (liker,post_id) VALUES ($1,$2) RETURNING *;`;
    let values = [obj.userID, obj.post_id];
    let all = await pool.query(sql, values);
    // return all;
  }
  static gitAllLikes = async () => {
    let sql = `SELECT * FROM likes;`;
    let allLikes = await pool.query(sql);
    return allLikes.rows;
  }
  static getLikers = async (likesArray) => {
    let likers = [];
    for (let i = 0; i < likesArray.length; i++) {
      let sql = `SELECT * FROM users WHERE id=${likesArray[i].liker};`;
      let liker=await pool.query(sql);
      likers.push(liker.rows[0]);
    }
    // console.log(likers);
  }
}

module.exports = Interface;
