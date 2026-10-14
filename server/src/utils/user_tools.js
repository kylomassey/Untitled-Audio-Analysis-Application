const argon2 = require('argon2')

function user_validation(username = null, email = null, password = null){
    let password_regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,128}$/
    let user_regex = /^[A-Za-z0-9_-]{6,255}$/
    let email_regex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,255}$/i
    
    if(password && !password_regex.test(password)) return false
    if(username && !user_regex.test(username)) return false
    if(email && !email_regex.test(email)) return false
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

module.exports = { user_validation, verify_password, hash_password } 