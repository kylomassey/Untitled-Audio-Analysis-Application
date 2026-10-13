const express = require('express')
const requireAuth = require('../middleware/requireAuth')
const router = express.Router()
const { user_validation } =  require('../utils/user_tools')
const MAX_RETRIES = 10 

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

router.patch('/username', requireAuth, async(req, res) =>{
    const new_username = req.body.new_username

    if(!user_validation(username = new_username)) return res.status(400).json({error: "Invalid username"})
    
})