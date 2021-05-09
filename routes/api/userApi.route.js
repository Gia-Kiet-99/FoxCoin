const express = require('express');
const router = express.Router();

const userApi = require('../../model/api/userApi.model');
const walletModel = require('../../model/wallet');
const bcryptUtil = require('../../util/bcrypt');
const usersModel = require('../../model/users.model')


router.get('/:email', async (req, res) => {
  const email = req.params.email;
  const ret = await userApi.checkEmailExists(email);
  if (ret) {
    return res.json({
      isEmailExists: true
    })
  }
  res.json({
    isEmailExists: false
  })
})

router.post('/', async (req, res) => {
  //sign up
  const email = req.body.email;
  const password = req.body.password;
  try {
    const key = walletModel.initWallet();
    const hashPassword = await bcryptUtil.hashPassword(password);

    const ids = await usersModel.add({ email, address: key.publicKey, password: hashPassword });
    console.log("ids: " + ids[0]);

    res.json(key);
  } catch (error) {
    console.log(error);
    res.status(400).json({
      error_message: "Something went wrong"
    })
  }
})


module.exports = router;