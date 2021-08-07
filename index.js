'use strict';
require('dotenv').config();
const pool = require('./pool');
const server = require('./src/server');

pool
  .connect()
  .then(() => {
    server.start(process.env.PORT);
  })
  .catch((e) => {
    console.log(e);
  });

