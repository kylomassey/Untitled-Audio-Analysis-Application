const express = require('express')
const argon2 = require('argon2')
const asyncHandler = require('../utils/asyncHandler')
const pool = require('../db')
const router = express.Router()
const MAX_RETRIES = 10 

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function user_validation(username, email, password){
    let password_regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,128}$/
    let user_regex = /^[A-Za-z0-9_-]{6,255}$/
    let email_regex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,255}$/i

    if(!password_regex.test(password)) return false
    if(!user_regex.test(username)) return false
    if(!email_regex.test(email)) return false
    return true
}

async function hash_password(password){
  try{
    const hash = await argon2.hash(password)
    return hash
  }catch(error){
    throw error
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

router.post('/register', asyncHandler (async(req, res) => {
  const { username, email, password } = req.body;
  let result = false
  let reason = null
  let retry = 0

  if (!user_validation(username, email, password))  return res.status(400).json({error: "Invalid registration information"})

  const hash = await hash_password(password)

  do{
    [result, reason] = await add_user(username, email, hash)
    retry ++
    if(reason === "connection" && retry < MAX_RETRIES) await sleep(200 * retry)
  }while (reason === "connection" && retry < MAX_RETRIES)


  switch(reason){
    case "email": return res.status(400).json({error: "Duplicate email found"})
    case "username": return res.status(400).json({error: "Duplicate username found"})
    case "duplicate": return res.status(400).json({error: "Other unique duplicate found"})
    case "connection": return res.status(500).json({error: "Database is down"})
    case "null": return res.status(400).json({error: "Null value found"})
    case "success": return res.status(201).json({message: "User Created", user: username, email: email})
    default: return res.status(500).json({ error: "Unexpected error" }) 
  }
}));

module.exports = router;