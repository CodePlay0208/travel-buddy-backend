const express = require('express');
const router = express.Router();
const User = require('../models/UserProfile'); // Assuming you have a User model
const DeletedUser = require('../models/DeletedUser');

// Delete user API
router.delete('/deleteUser', async (req, res) => {
    
  const userId = req.session? req.session.user ? req.session.user.id : null : null;

  try {
    
    const user = await User.findById(userId);
    console.log(user)
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const deletedUser = new DeletedUser({
      userId: user._id,
      username: user.username,
      email: user.emailId,
    });

    await deletedUser.save();
    await User.findByIdAndDelete(userId);

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

module.exports = router;
