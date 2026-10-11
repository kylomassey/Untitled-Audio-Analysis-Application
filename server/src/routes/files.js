const { upload_audio } = require('../models/files')
const { UPLOAD_DIR } = require('../config')
const express = require('express')
const fs = require('fs')
const crypto = require('crypto')
const multer  = require('multer')
const requireAuth = require('../middleware/requireAuth')
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR)
  },
  filename: function (req, file, cb) {
    crypto.randomBytes(16, function (err, raw) {
      if (err) return cb(err)
      cb(null, file.fieldname + '-' + raw.toString('hex'))
    })
  }
})
const upload = multer({ storage: storage, limits: { fileSize: 50 * 1024 * 1024 } }) // Limit file size to 50MB
const router = express.Router()
const MAX_RETRIES = 10

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

router.post('/upload', requireAuth, upload.single('audio'), async(req, res) => {
    let retry = 0
    let result = null
    let outcome = null
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' })
    }
    console.log("File uploaded:", req.file)
    const user_id = req.user.id
    const { size, filename, originalname, path: filepath } = req.file
    do{
        [result, outcome] = await upload_audio(size, filename, originalname, user_id)
        retry ++
        if(outcome === "connection" && retry < MAX_RETRIES) await sleep(200*retry)
    }while(outcome === "connection" && retry < MAX_RETRIES)
    
    if(outcome !== "success"){
        try{
            await fs.promises.unlink(filepath)
        }catch(error){
            console.error("Error deleting file after failed upload:", error)
        }
    }
    switch(outcome){
        case "null": return res.status(400).json({error: "Null value found"})
        case "connection": return res.status(500).json({error: "Database is down"})
        case "other": return res.status(500).json({ error: "Unexpected error" }) 
    }
    return res.status(200).json({message: "File uploaded successfully"})
})

module.exports = router;