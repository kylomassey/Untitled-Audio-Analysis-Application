const {Pool} = require("pg");

if(!process.env.DATABASE_URL){
    throw new Error("DATABASE_URL is missing. Did you create a .envfile?");
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

module.exports = pool;