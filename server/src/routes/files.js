const express = require('express')
const path = require('path')
const fs = require('fs')
const UPLOAD_DIR = path.join(__dirname, '..', '..', '/uploads')
fs.mkdirSync(UPLOAD_DIR, { recursive: true })

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

router.post('/upload', requireAuth, upload.single('audio'), async(req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' })
    }
    return res.status(200).json({message: "File uploaded successfully"})
})

module.exports = router;