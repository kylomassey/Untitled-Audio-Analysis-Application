const {Pool} = require("pg");

if(!process.env.Database_URL){
    throw new Error("DATABASE_URL is missing. Did you create a .envfile?");
}

const pool = new Pool({
    connectionString: process.env.Database_URL,
});

module.exports = pool;