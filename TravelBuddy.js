require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT;


const userController = require('./Controller/UserProfileController');
app.use('/user', userController);


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});