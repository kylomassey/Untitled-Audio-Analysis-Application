require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth');
const fileRoutes = require('./routes/files');
const userroutes = require('./routes/user_info')


const app = express();

app.use(express.json());
app.use(cookieParser());

app.use('/users', userroutes);
app.use('/auth', authRoutes);
app.use('/files', fileRoutes);

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: "Something went wrong" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));