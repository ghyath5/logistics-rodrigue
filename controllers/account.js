const User = require("../models/User");
const CryptoJS = require("crypto-js");
const { log } = require("../helpers/Loger");

exports.update = async (req, res) => {
  try {
    const { id } = req.user;
    const { name, username, email, phonenumber } = req.body;
    const user = await User.findByIdAndUpdate(
      id,
      {
        name,
        username,
        email,
        phonenumber,
      },
      { new: true }
    );
    if (!user) return res.status(404).json("No User was found by this id");
    const { password, ...others } = user._doc;
    res.status(200).json({
      message: "User updated successfully",
      user: others,
    });
  } catch (err) {
    console.log("updateAccount", err);
    await log(`updateAccount error : ${err}`);
    res.status(500).json(err);
  }
};

exports.getAccount = async (req, res) => {
  try {
    const { id } = req.user;
    const user = await User.findById(id);
    if (!user) return res.status(404).json("Account not found");
    const { password, ...others } = user._doc;

    return res.status(200).json({
      message: "User fetched successfully",
      user: others,
    });
  } catch (err) {
    console.log("getAccount", err);
    await log(`getAccount error : ${err}`);
    res.status(500).json(err);
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { id } = req.user;
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(id);

    if (!oldPassword || !newPassword)
      return res.status(400).json("Please fill all the fields");

    const hashedPassword = CryptoJS.AES.decrypt(
      user.password,
      process.env.PASS_SEC
    );

    const originalPassword = hashedPassword.toString(CryptoJS.enc.Utf8);

    if (originalPassword != oldPassword) {
      return res.status(400).json("Wrong password");
    }

    await User.findByIdAndUpdate(
      id,
      {
        password: CryptoJS.AES.encrypt(
          newPassword,
          process.env.PASS_SEC
        ).toString(),
      },
      { new: true }
    );

    res.status(200).json({
      message: "Password changed successfully",
    });
  } catch (err) {
    console.log("changePassword", err);
    await log(`change password error : ${err}`);
    res.status(500).json(err);
  }
};
