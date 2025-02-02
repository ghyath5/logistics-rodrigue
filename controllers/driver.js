const Driver = require("../models/Driver");
const Run = require("../models/Run");
const Sharedrecords = require("../models/Sharedrecords");
const { log } = require("../helpers/Loger");

exports.createDriver = async (req, res) => {
  try {
    const newDriver = new Driver(req.body);
    const driverName = await Driver.findOne({ name: req.body.name });
    if (driverName) {
      return res
        .status(403)
        .json("A driver with this name has already been created");
    } else {
      const codeSequence = await Sharedrecords.findById(
        process.env.SHARED_RECORDS_ID
      );
      let codeid = codeSequence.drivercodeid;
      codeid = codeid.toString();

      while (codeid.length < 4) {
        codeid = "0" + codeid;
      }
      newDriver.code = codeid;
      const savedDriver = await newDriver.save();
      res.status(200).json(savedDriver);
      await Sharedrecords.findByIdAndUpdate(process.env.SHARED_RECORDS_ID, {
        $inc: { drivercodeid: 1 },
      });
    }
  } catch (err) {
    await log(`createDriver error : ${err}`);
    res.status(500).json(err);
  }
};
exports.updateDriver = async (req, res) => {
  try {
    const updatedDriver = await Driver.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body,
      },
      { new: true }
    );

    if (updatedDriver) {
      res.status(200).json(updatedDriver);
    } else {
      res.status(404).json("No driver was found with this id");
    }
  } catch (err) {
    await log(`updateDriver error : ${err}`);
    res.status(500).json(err);
  }
};
exports.deleteDriver = async (req, res) => {
  try {
    const runWithThisDriver = await Run.find({
      driver: req.params.id,
    });
    if (runWithThisDriver.length)
      return res.status(403).json({
        success: false,
        message: "Cannot delete driver when associated with a run",
      });

    await Driver.findByIdAndDelete(req.params.id);
    return res.status(200).json({
      success: false,
      message: "Driver has been successfully deleted...",
    });
  } catch (err) {
    await log(`deleteDriver error : ${err}`);
    res.status(500).json(err);
  }
};
exports.getDriver = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (driver) {
      res.status(200).json(driver);
    } else {
      res.status(404).json("No driver was found with this id");
    }
  } catch (err) {
    await log(`getDriver error : ${err}`);
    res.status(500).json(err);
  }
};
exports.getAllDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find().sort({ _id: -1 });
    const driversCount = await Driver.countDocuments();
    let objectToSend = {
      driversCount,
      drivers,
    };
    if (drivers) {
      res.status(200).json(objectToSend);
    } else {
      res.status(404).json("There are no drivers");
    }
  } catch (err) {
    await log(`getAllDrivers error : ${err}`);
    res.status(500).json(err);
  }
};
