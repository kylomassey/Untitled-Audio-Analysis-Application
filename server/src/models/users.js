const pool = require('../db')

async function get_user_hash(username = null){
  if(!username) return [[], "null"]

  try{
    const result = await pool.query(
      "SELECT id, password_hash FROM users WHERE username = $1",
      [username]
    )
    return [result, "success"]
  }catch(error){
    if (["ECONNREFUSED", "ETIMEDOUT", "08006", "08000", "08001", "57P01"].includes(error.code)) {
      return [[], "connection"];
    }
    return [[], "other"]
  }
}

async function add_user(username = null, email = null, hash = null){
  if(!username || !email || !hash) return [false, "null"]

  try{
    const result = await pool.query(
      "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, created_at",
      [username, email, hash]
    )
    return [true, "success"]
  }catch(error){
    if (error.code === "23505"){
      if (error.constraint === "users_email_key"){
        return [false, "email"]
      }
      if (error.constraint === "users_username_key"){
        return [false, "username"]
      }
      return [false, "duplicate"]
    }
    if (["ECONNREFUSED", "ETIMEDOUT", "08006", "08000", "08001", "57P01"].includes(error.code)) {
      return [false, "connection"];
    }
    return [false, "other"]
  }
}

module.exports = { get_user_hash, add_user }