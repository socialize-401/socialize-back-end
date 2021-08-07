'use strict';
const express = require('express');
const router = express.Router();
const checker = require('../validators/signupInfoChecker');
const Interface = require('../models/interface.js');
const SECRET = process.env.SECRET;
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const base64 = require('base-64');
const bcrypt = require('bcrypt');
const pool = require('../../pool.js');

router.get('/confirmation/:token', async (req, res) => {
  try {
    const { user } = jwt.verify(req.params.token, SECRET);
    let verified = await Interface.verify(user);
  } catch (e) {
    res.send(e.message);
  }
  return res.redirect('http://localhost:3000/');
});

router.get('/', (req, res) => {
  res.send('Hello home route !');
});

router.get('/signin', async (req, res) => {
  // console.log(req);

  try {
    // console.log(req.headers.authorization);
    let basicHeaderParts = req.headers.authorization.split(' '); // ['Basic', 'sdkjdsljd=']
    let encodedString = basicHeaderParts.pop(); // sdkjdsljd=
    let decodedString = base64.decode(encodedString); // "username:password"
    let [email, password] = decodedString.split(':'); // username, password
    let checks = await Interface.read(email);
    // console.log(checks.rows[0]);
    if (checks.rows[0] === undefined) {
      throw new Error('invaild login');
    }
    if (checks.rows[0]) {
      // console.log(checks.rows[0]);
      let valid = await bcrypt.compare(password, checks.rows[0].pass);
      if (!valid) {
        throw new Error('invalid login');
      }
      if (!checks.rows[0].verified) {
        throw new Error('not verified');
      }
      console.log('logged in');

      let sql = `SELECT * FROM users WHERE id=$1;`;
      let value = [checks.rows[0].id];
      let user = await pool.query(sql, value);
      // console.log(user.rows[0]);
      return res.send(user.rows[0]);
    }
  } catch (e) {
    console.log(e.message);
    res.status(500).send(e);
  }
});

// router.get('/logout', async (req, res) => {
//   //   console.log(req);
//   console.log('loggedout');
//   res.send('huiasdjfhak');
// });

router.post('/signup', checker, async (req, res) => {
  try {
    const { email, pass, firstName, lastName } = req.body;
    let checkEmail = await Interface.read(email);
    console.log(checkEmail.rows);
    if (checkEmail.rows.length != 0) {
      throw new Error('Email alredy used');
    } else {
      let created = await Interface.create({
        email,
        pass,
        firstName,
        lastName,
      });
      console.log(created.rows);
    }
    // console.log(checkEmail.rows);
  } catch (e) {
    console.log(e);
    res.send(e);
  }
});
module.exports = router;
