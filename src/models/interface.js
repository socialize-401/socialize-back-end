'use strict';
require('dotenv').config();
const pool = require('../../pool.js');

const jwt = require('jsonwebtoken');
const nodemailer = require("nodemailer");
const bcrypt = require('bcrypt'); 
const SECRET = process.env.SECRET;


class Interface {

    static create = async (obj) => {
        let sql = `INSERT INTO auth (Email,pass,token) VALUES ($1,$2,$3) RETURNING *;`;
        let sql1 = `INSERT INTO users (firstName,lastName) VALUES ($1,$2) RETURNING *;`;
        let hashedPassword = await bcrypt.hash(obj.pass,10)
        let token = jwt.sign({
            user: obj.email
        },SECRET, {
            expiresIn: '1d'
        });
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
            subject: "confirm your email to login", // Subject line
            text: "Hello world?", // plain text body
            html: `<b>confirmation email:</b><br><a href="${url}">${url}</a>`, // html body
        });
        return created;
    }
    static read(email) {
        if (email) {
            let sql = `SELECT * FROM auth WHERE Email=$1;`;
            let value = [email];
            return pool.query(sql, value);
        }
    }
    static verify(email){
        let sql = `UPDATE auth SET verified=$1 WHERE Email=$2 RETURNING *;`;
        let value = [true,email];
        return pool.query(sql,value);
    }
}

module.exports = Interface;