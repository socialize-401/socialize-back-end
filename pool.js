require('dotenv').config();
const Pool = require('pg').Pool;
module.exports= new Pool({
   connectionString:process.env.DATABASE_URL,
});