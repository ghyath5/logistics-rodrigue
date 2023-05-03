const User = require("../models/User");
const Driver = require("../models/Driver");
const { log } = require("../helpers/Loger");

exports.getAllAdmins = async (req, res) => {
  try {
    const users = await User.find({ role: 1 });
    if (!users)
      return res
        .status(404)
        .json({ success: "false", message: "There are no admins yet" });
    else return res.status(200).json(users);
  } catch (err) {
    await log(`getAllAdmins error : ${err}`);
    res.status(500).json(err);
  }
};
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 0 });
    if (!users)
      return res
        .status(404)
        .json({ success: "false", message: "There are no users yet" });
    else return res.status(200).json(users);
  } catch (err) {
    await log(`getAllUsers error : ${err}`);
    res.status(500).json(err);
  }
};
exports.getAllStaff = async (req, res) => {
  try {
    const users = await User.find();
    const drivers = await Driver.find();
    let jsonToSend = {
      users,
      drivers,
    };
    return res.status(200).json({ success: true, data: jsonToSend });
  } catch (err) {
    await log(`getAllStaff error : ${err}`);
    res.status(500).json(err);
  }
};
