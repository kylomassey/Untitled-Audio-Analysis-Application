const crypto = require('crypto');

function hash_token(token = null){
    if (!token) token = crypto.randomBytes(32).toString('hex')
    const token_hash = crypto.createHash('sha256').update(token).digest('hex')
    return [token, token_hash]
}

module.exports = hash_token