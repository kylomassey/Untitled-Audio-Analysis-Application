// server/src/routes/auth.js
const express = require('express');
const argon2 = require('argon2');
const pool = require('../db'); // your pg connection pool
const router = express.Router();

router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

  // 1. Basic validation — are username/email/password all present?
  //    (return a 400 error if anything's missing)
    if (!user_validation(username, email, password))  return res.status(400).json({error: "Invalid registration information"})

  // 2. Hash the password with argon2.hash(password)
  //    (this is async — await it)

  // 3. Insert into users (username, email, password_hash)
  //    using a parameterized query — never string-concatenate user input into SQL

  // 4. Handle the case where username/email already exists
  //    (your UNIQUE constraints will throw an error — catch it and
  //    return a friendly 409/400 instead of a raw DB error)

  // 5. On success, return 201 with... what should you send back?
  //    (think about what NOT to send back here)
});

function user_validation(username, email, password){
    let password_regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@.#$!%*?&])[A-Za-z\d@.#$!%*?&]{8,}$/
    let user_regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{6,50}$/
    let email_regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@])[A-Za-z\d@.#$!%*?&]{6,}$/

    if(!password_regex.test(password) || !user_regex.test(username) || !email_regex.test(email)) return false
}

module.exports = router;