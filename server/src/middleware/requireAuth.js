const pool = require('../db')
const crypto = require('crypto')
const { hash_token } = requre('../services/tokenService')
const MAX_RETRIES = 10

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }


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

async function requireAuth(req,res,next){
    const token = req.cookies.session_token
    let result = null
    let outcome = null
    let retry = 0

    if(!token){
        return res.status(401).json({error:"Not Authenticated"})
    }
    const [,token_hash] = hash_token(token)

    do{
        [result,outcome] =  await check_hash(token_hash)
        retry ++
        if(outcome === "connection" && retry < MAX_RETRIES) await sleep(200*retry)
    }while(outcome === "connection" && retry < MAX_RETRIES)
    
    switch(outcome){
        case "null": return res.status(400).json({error: "Null value found"})
        case "connection": return res.status(500).json({error: "Database is down"})
        case "other": return res.status(500).json({ error: "Unexpected error" }) 
    }

    if(result.rows.length === 0) return res.status(401).json({error: "Not Authenticated"})

    const session = result.rows[0]

    if(new Date(session.expires_at).getTime() <= Date.now()) return res.status(401).json({error: "Session Expired"})
    
    req.user = { id: session.user_id, username: session.username }
    return next()
}

module.exports = requireAuth