const express = require('express')
const argon2 = require('argon2')
const asyncHandler = require('../utils/asyncHandler')
const pool = require('../db')
const crypto = require('crypto')
const router = express.Router()
const MAX_RETRIES = 10 

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function create_token(){
 const token = crypto.randomBytes(32).toString('hex')
 const token_hash = crypto.createHash('sha256').update(token).digest('hex')
 return [token, token_hash]
}

function user_validation(username, email, password, mode = "login"){
    let password_regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,128}$/
    let user_regex = /^[A-Za-z0-9_-]{6,255}$/
    let email_regex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,255}$/i
    
    if(!password_regex.test(password)) return false
    if(!user_regex.test(username)) return false
    if (mode === "register"){
      if(!email_regex.test(email)) return false
    }
    return true
}

async function verify_password(password, hash){
  try{
    return await argon2.verify(hash, password)
  }catch(error){
    throw error
  }
}

async function hash_password(password){
  try{
    const hash = await argon2.hash(password)
    return hash
  }catch(error){
    throw error
  }
}

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

async function create_session(id, token_hash){
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

router.post('/login', asyncHandler(async(req,res) =>{
  const {username, password} = req.body
  let outcome = null
  let retry = 0
  let result = null

  if (!user_validation(username, null, password))  return res.status(401).json({error: "Invalid username or password"})

  do{
    [result, outcome] = await get_user_hash(username)
    retry ++
    if(outcome === "connection" && retry < MAX_RETRIES) await sleep(200 * retry)
  }while(outcome === "connection" && retry < MAX_RETRIES)

  switch(outcome){
    case "null": return res.status(400).json({error: "Null value found"})
    case "connection": return res.status(500).json({error: "Database is down"})
    case "other": return res.status(500).json({ error: "Unexpected error" }) 
  }

  let user = result.rows[0]

  if(result.rows.length === 0 || !(await verify_password(password, user.password_hash))) return res.status(401).json({error: "Invalid username or password"})

  let [token, token_hash] = create_token()

  retry = 0

  do{
    [result, outcome] = await create_session(user.id, token_hash)
    retry ++
    if(outcome === "connection" && retry < MAX_RETRIES) await sleep(200 * retry)
    else if(outcome === "hash") [token, token_hash] = create_token()
  }while((outcome === "hash" || outcome === "connection") && retry < MAX_RETRIES)

  switch(outcome){
    case "null": return res.status(400).json({error: "Null value found"})
    case "connection": return res.status(500).json({error: "Database is down"})
    case "duplicate": return res.status(400).json({error: "Other unique duplicate found"})
    case "hash": return res.status(500).json({ error: "Could not create session, please try again" })
    case "other": return res.status(500).json({ error: "Unexpected error" }) 
  }

  res.cookie('session_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 1000 * 60 * 60 * 24 * 7
  });

  return res.status(200).json({message: "successful login", user: username})

}))

router.post('/register', asyncHandler (async(req, res) => {
  const { username, email, password } = req.body
  let result = false
  let reason = null
  let retry = 0

  if (!user_validation(username, email, password, "register"))  return res.status(400).json({error: "Invalid registration information"})

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