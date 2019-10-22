const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');

// @route  GET api/auth
// @desc   Test router
// @access Public
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  }catch(err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route  POST api/users
// @desc   Authenticate user & get token
// @access Public

router.post('/',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', ' Password is required').exists()
  ],
  async (req, res) => {
  const errors = validationResult(req);
  if(!errors.isEmpty()){
      return res.status(400).json({errors: errors.array()});
  }
  //coming from input form
  const { email, password } = req.body;
  try{
    // Finding the email whether Register or not
    let user = await User.findOne({ email });
    // See if user exists
    if(!user){
      return res.status(400).json({ errors: [{ msg: 'Invalid Credentails '}] });
    }

    //Compare the password
    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch){
      return res.status(400).json({ errors: [{ msg: 'Invalid Credentails '}] });
    }

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
