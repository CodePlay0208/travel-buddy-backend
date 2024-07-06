const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const UserProfile = require('../models/UserProfile');
const bodyParser = require('body-parser');
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.use(bodyParser.json());

const isValidEmail = (email) => emailRegex.test(email);

router.post('/createUserProfile', async (req, res) => {
  const { username, password, emailId } = req.body;

  if (!isValidEmail(emailId)) {
    return res.status(400).json({ message: 'Email Id not valid' });
  }

  try {
    const existingUser = await UserProfile.findOne({ emailId });
    if (existingUser) {
      return res.status(400).json({ message: 'User with given EmailId already exists' });
    }

    const newUser = new UserProfile({ username, password, emailId });
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error', error });
  }
});

router.get('/getUserProfile', async (req, res) => {
  const { emailId } = req.query;

  if (!isValidEmail(emailId)) {
    return res.status(400).json({ message: 'Email Id not valid' });
  }

  try {
    const user = await UserProfile.findOne({ emailId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error', error });
  }
});

module.exports = router;
