const jwt = require("jsonwebtoken");
const CryptoJS = require("crypto-js");
const User = require("../models/User");
const { log } = require("../helpers/Loger");

exports.signup = async (req, res) => {
  try {
    const { name, email, phonenumber, username, role } = req.body;

    const emailUser = await User.findOne({ email });
    if (emailUser) {
      return res.status(400).json({
        success: false,
        message:
          "This email is already in use, try sign-in with a different one",
      });
    }

    const nameUser = await User.findOne({ name });
    if (nameUser) {
      return res.status(400).json({
        success: false,
        message:
          "This name is already in use, try sign-in with a different one",
      });
    }

    const phonenumberUser = await User.findOne({ phonenumber });
    if (phonenumberUser) {
      return res
        .status(399)
        .json({ success: false, message: "This phone number already exists" });
    }

    const newUser = new User({
      name,
      username,
      email,
      phonenumber,
      role,
      password: CryptoJS.AES.encrypt(
        req.body.password,
        process.env.PASS_SEC
      ).toString(),
    });
    let savedUser = await newUser.save();
    res.status(200).json(savedUser);
  } catch (err) {
    await log(`signUp error : ${err}`);
    res.status(500).json(err);
  }
};

exports.login = async (req, res) => {
  try {
    const user = await User.findOne({
      username: req.body.username,
    });
    if (!user) return res.status(400).json("Wrong username or passwordd");

    const hashedPassword = CryptoJS.AES.decrypt(
      user.password,
      process.env.PASS_SEC
    );

    const originalPassword = hashedPassword.toString(CryptoJS.enc.Utf8);

    const inputPassword = req.body.password;
    if (originalPassword != inputPassword) {
      return res.status(400).json("Wrong username or passwordd");
    }

    const accessToken = jwt.sign(
      {
        id: user._id,
        role: user.role,
        isUpperAdmin: user.isUpperAdmin,
      },
      process.env.JWT_SEC,
      { expiresIn: "3d" }
    );
    let AuDate = new Date().toISOString("en-US", {
      timeZone: "Australia/Sydney",
    });

    let userId = user._id.toString();

    await User.findByIdAndUpdate(userId, {
      $set: { lastlogin: AuDate },
    });

    const { password, ...others } = user._doc;
    return res.status(200).json({ ...others, accessToken });
  } catch (err) {
    await log(`login error : ${err}`);
    res.status(500).json(err);
  }
};
