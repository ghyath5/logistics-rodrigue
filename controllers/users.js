const User = require("../models/User");
const Order = require("../models/Orders");
const { log } = require("../helpers/Loger");

exports.updateUser = async (req, res) => {
  if (req.body.password) {
    req.body.password = CryptoJS.AES.encrypt(
      req.body.password,
      process.env.PASS_SEC
    ).toString();
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body,
      },
      { new: true }
    );
    res.status(200).json(updatedUser);
  } catch (err) {
    await log(err);
    res.status(500).json(err);
  }
};
exports.deteleUser = async (req, res) => {
  try {
    const ordersWithThisUser = await Order.find({
      initiateduser: req.params.id,
    });
    if (ordersWithThisUser?.length)
      return res.status(403).json({
        success: false,
        message: "Cannot delete user when associated to an order",
      });

    await User.findByIdAndDelete(req.params.id);
    return res.status(200).json({
      success: false,
      message: "User has been successfully deleted...",
    });
  } catch (err) {
    await log(err);
    res.status(500).json(err);
  }
};
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(200).json("No User was found by this id");
    const { password, ...others } = user._doc;
    res.status(200).json(others);
  } catch (err) {
    await log(err);
    res.status(500).json(err);
  }
};
exports.getAllUsers = async (req, res) => {
  try {
    const { page, limit } = req.query;
    if (!page || !limit)
      return res
        .status(400)
        .json("the required query parameters are : page and limit");
    const users = await User.find()
      .sort({ _id: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    const userCount = await User.countDocuments();
    let objectTosend = {
      userCount,
      users,
    };
    res.status(200).json(objectTosend);
  } catch (err) {
    await log(err);
    res.status(500).json(err);
  }
};
exports.findUsersByTextSearch = async (req, res) => {
  const { find, page, limit } = req.query;
  try {
    const found = await User.find({
      $or: [
        { name: { $regex: find, $options: "i" } },
        { phonenumber: { $regex: find, $options: "i" } },
        { email: { $regex: find, $options: "i" } },
      ],
    })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    if (!found) return res.status(404).json("No Users were found");
    return res.status(200).json(found);
  } catch (err) {
    console.log("err", err);
    await log(err);
    res.status(500).json(err);
  }
};
