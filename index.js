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

// {
//     "dependencies": {
//       "base-64": "^1.0.0",
//       "bcrypt": "^5.0.1",
//       "cors": "^2.8.5",
//       "dotenv": "^10.0.0",
//       "express": "^4.17.1",
//       "jsonwebtoken": "^8.5.1",
//       "mongoose": "^5.13.3",
//       "nodemailer": "^6.6.3",
//       "pg": "^8.7.1",
//       "socket.io": "^4.1.3",
//       "uuid": "^8.3.2"
//     },
//     "devDependencies": {
//       "http-proxy-middleware": "^2.0.1"
//     }
//   }
