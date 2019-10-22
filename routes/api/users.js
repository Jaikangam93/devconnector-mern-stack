const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');

const User = require('../../models/User');

// @route  POST api/users
// @desc   Register User
// @access Public
router.post('/',
 [
   check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min:6})

  ],
  async (req, res) => {
  const errors = validationResult(req);
  if(!errors.isEmpty()){
      return res.status(400).json({errors: errors.array()});
  }
  //coming from input form
  const { name, email, password } = req.body;
  try{
    // Finding the email whether Register or not
    let user = await User.findOne({ email });
    // See if user exists
    if(user){
      return res.status(400).json({ errors: [{ msg: 'User already exist!'}] });
    }

    // Get users gravatar
    const avatar = gravatar.url(email,{
      s: '200',
      r: 'pg',
      d: 'mm'
    });

    user = new User({
      name,
      email,
      avatar,
      password
    });

    // Encrypt password
    const salt = await bcrypt.genSalt(10);

    user.password = await bcrypt.hash(password, salt);
    //save the user in the database
    await user.save();

    // JWT Payload
    const payload = {
        user:{
          id: user.id
        }
    }
    // jwt sign in the token
    jwt.sign(
      payload,
      config.get('jwtSecret'),
      { expiresIn: 360000 },
      (err, token) => {
        if(err) throw err;
        res.json({ token });
      });

  }catch(err){
    console.error(err.message);
    res.status(500).send('Server error');
  }

});

module.exports = router;
