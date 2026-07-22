const pool = require('../db')

async function create_session(id= null, token_hash = null){
  if(!id || !token_hash) return [false, "null"]
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)

  try{
    const result = await pool.query(
      "INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
      [id, token_hash, expiresAt]
    )
    return [true, "success"]
  }catch (error){
    if (error.code === "23505"){
      if (error.constraint === "sessions_token_hash_key"){
        return [false, "hash"]
      }
      return [false, "duplicate"]
    }
    if (["ECONNREFUSED", "ETIMEDOUT", "08006", "08000", "08001", "57P01"].includes(error.code)) {
      return [false, "connection"];
    }
    return [false, "other"]
  }
}

async function delete_session(token_hash = null){
  if(!token_hash) return [[], "null"]

  try{
    const result = await pool.query(
      "DELETE FROM sessions WHERE token_hash = $1",
      [token_hash]
    )
    return [result, "success"]
  }catch (error){
    if (["ECONNREFUSED", "ETIMEDOUT", "08006", "08000", "08001", "57P01"].includes(error.code)) {
      return [[], "connection"];
    }
    return [[], "other"]
  }
}

async function check_hash(token_hash = null){
    if(!token_hash) return [[], "null"]
    try{
        const result = await pool.query(
            "SELECT sessions.user_id, sessions.expires_at, users.username FROM sessions JOIN users ON sessions.user_id = users.id WHERE sessions.token_hash = $1",
            [token_hash]
        )
        return [result, "success"]
    }catch(error){
        if (["ECONNREFUSED", "ETIMEDOUT", "08006", "08000", "08001", "57P01"].includes(error.code)) {
            return [[], "connection"];
        }
        return [[], "other"]
    }
}

module.exports = { create_session, delete_session, check_hash }