const Biller = require("../models/Biller");
const Sharedrecords = require("../models/Sharedrecords");
const { log } = require("../helpers/Loger");

exports.createBiller = async (req, res) => {
  const newBiller = new Biller(req.body);
  const codeSequence = await Sharedrecords.findById("63663fa59b531a420083d78f");
  let codeid = codeSequence.billercodeid;

  newBiller.number = codeid;
  try {
    const billerName = await Biller.findOne({ name: req.body.name });
    if (billerName) {
      return res
        .status(403)
        .json("A biller with this name has already been created");
    } else {
      const savedBiller = await newBiller.save();
      res.status(200).json(savedBiller);
      await Sharedrecords.findByIdAndUpdate(
        "63663fa59b531a420083d78f",
        {
          $inc: { billercodeid: 1 },
        },
        { new: true }
      );
    }
  } catch (err) {
    await log(err);
    res.status(500).json(err);
  }
};

exports.updateBiller = async (req, res) => {
  try {
    const updatedBiller = await Biller.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body,
      },
      { new: true }
    );

    if (updatedBiller) {
      res.status(200).json(updatedBiller);
    } else {
      res.status(404).json("No biller was found with this id");
    }
  } catch (err) {
    await log(err);
    res.status(500).json(err);
  }
};

exports.deleteBiller = async (req, res) => {
  try {
    await Biller.findByIdAndDelete(req.params.id);
    res.status(200).json("Biller has been deleted...");
  } catch (err) {
    await log(err);
    res.status(500).json(err);
  }
};

exports.getBiller = async (req, res) => {
  try {
    const biller = await Biller.findById(req.params.id);
    if (biller) {
      res.status(200).json(biller);
    } else {
      res.status(404).json("No biller was found with this id");
    }
  } catch (err) {
    await log(err);
    res.status(500).json(err);
  }
};

exports.getAllBillers = async (req, res) => {
  try {
    const billers = await Biller.find().sort({ _id: -1 });
    const billerCount = await Biller.countDocuments();
    let objectTosend = {
      billerCount,
      billers,
    };
    if (billers) {
      res.status(200).json(objectTosend);
    } else {
      res.status(404).json("There are no billers");
    }
  } catch (err) {
    await log(err);
    res.status(500).json(err);
  }
};
