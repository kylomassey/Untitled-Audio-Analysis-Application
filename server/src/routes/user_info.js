const express = require('express')
const requireAuth = require('../middleware/requireAuth')
const router = express.Router()
const { user_validation, hash_password, verify_password } =  require('../utils/user_tools')
const { change_username, change_password, get_user_hash } = require('../models/users')
const { password } = require('pg/lib/defaults')
const MAX_RETRIES = 10 

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

router.patch('/username', requireAuth, async(req, res) =>{
    const new_username = req.body.new_username
    const user_id = req.body.user_id
    let retry = 0
    let outcome = null
    let result = null
    if(!user_validation(new_username, null, null)) return res.status(400).json({error: "Invalid username"})

    do{
        [result, outcome] = change_username(user_id, new_username)
        retry ++
        if(outcome === "connection" && retry < MAX_RETRIES) await sleep(200*retry)
    }while(outcome === "connection" && retry < MAX_RETRIES)

    switch(outcome){
        case "null": return res.status(400).json({error: "Null value found"})
        case "invalid": return res.status(400).json({error: "Failed to change username"})
        case "connection": return res.status(500).json({error: "Database is down"})
        case "other": return res.status(500).json({ error: "Unexpected error" }) 
    }

    return res.status(200).json({message: `Username changed successfully to ${outcome}`})
    
})

router.patch('/password', requireAuth, async(req, res) =>{
    const new_password = req.body.new_password
    const cur_password = req.body.cur_password
    const username = req.user.username
    const user_id = req.user.user_id
    let retry = 0
    let outcome = null
    let result = null

    if(!user_validation(null, null, new_password)) return res.status(400).json({error: "Invalid new password"})

    const new_hash = await hash_password(new_password)
    do{
        [result, outcome] = await get_user_hash(username)
        retry ++
        if(outcome === "connection" && retry < MAX_RETRIES) await sleep(200*retry)
    }while(outcome === "connection" && retry < MAX_RETRIES)
        
        switch(outcome){
            case "connection": return res.status(500).json({error: "Database is down"})
            case "other": return res.status(500).json({ error: "Unexpected error" })
        }
    if(!(await verify_password(cur_password, result))) return res.status(401).json({error: "Invalid password"})

    retry = 0
    do{
        [result, outcome] = await change_password(user_id, new_hash)
        retry ++
        if(outcome === "connection" && retry < MAX_RETRIES) await sleep(200*retry)
    }while(outcome === "connection" && retry < MAX_RETRIES)

        switch(outcome){
        case "null": return res.status(400).json({error: "Null value found"})
        case "invalid": return res.status(400).json({error: "Failed to change password"})
        case "connection": return res.status(500).json({error: "Database is down"})
        case "other": return res.status(500).json({ error: "Unexpected error" }) 
    }

    return res.status(200).json({message: "Successfully changed password"})
})