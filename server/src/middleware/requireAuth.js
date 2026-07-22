const { hash_token } = require('../services/tokenService')
const { check_hash } =  require('../models/sessions')
const MAX_RETRIES = 10

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

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