const DeliveryOccur = require("../models/Deliveriesoccur");
const Sharedrecords = require("../models/Sharedrecords");
const Customer = require("../models/Customer");
const { log } = require("../helpers/Loger");

exports.createDeliveryOccur = async (req, res) => {
  const newDeliveryOccur = new DeliveryOccur(req.body);
  const codeSequence = await Sharedrecords.findById("63663fa59b531a420083d78f");
  let codeid = codeSequence.deliveryoccurcodeid;

  newDeliveryOccur.number = codeid;
  try {
    const deliveryOccurName = await DeliveryOccur.findOne({
      name: req.body.name,
    });
    if (deliveryOccurName) {
      return res
        .status(403)
        .json("A delivery occur with this name has already been created");
    } else {
      const savedDeliveryOccur = await newDeliveryOccur.save();
      res.status(200).json(savedDeliveryOccur);
      await Sharedrecords.findByIdAndUpdate(
        "63663fa59b531a420083d78f",
        {
          $inc: { deliveryoccurcodeid: 1 },
        },
        { new: true }
      );
    }
  } catch (err) {
    await log(err);
    res.status(500).json(err);
  }
};
exports.updateDeliveryOccur = async (req, res) => {
  try {
    const updatedDeliveryOccur = await DeliveryOccur.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body,
      },
      { new: true }
    );
    if (updatedDeliveryOccur) {
      return res.status(200).json(updatedDeliveryOccur);
    } else {
      return res
        .status(404)
        .json("No delivery occur method was found by this id");
    }
  } catch (err) {
    await log(err);
    res.status(500).json(err);
  }
};
exports.deleteDeliveryOccur = async (req, res) => {
  try {
    const customerWithThisDeliveryOccur = await Customer.find({
      deliveryoccur: req.params.id,
    });
    if (customerWithThisDeliveryOccur.length)
      return res.status(403).json({
        success: false,
        message:
          "Cannot delete this delivery occur option when associated with a customer",
      });

    await DeliveryOccur.findByIdAndDelete(req.params.id);
    return res.status(200).json({
      success: false,
      message: "Delivery occur option has been successfully deleted...",
    });
  } catch (err) {
    await log(err);
    res.status(500).json(err);
  }
};
exports.getDeliveryOccur = async (req, res) => {
  try {
    const deliveryOccur = await DeliveryOccur.findById(req.params.id);
    if (deliveryOccur) {
      res.status(200).json(deliveryOccur);
    } else {
      res.status(404).json("No delivery occur method was found by this id");
    }
  } catch (err) {
    await log(err);
    res.status(500).json(err);
  }
};
exports.getAllDeliveryOccur = async (req, res) => {
  try {
    const deliveryOccur = await DeliveryOccur.find().sort({ _id: -1 });
    const deliveryOccurCount = await DeliveryOccur.countDocuments();

    let objectTosend = {
      deliveryOccurCount,
      deliveryOccur,
    };

    if (deliveryOccur) {
      res.status(200).json(objectTosend);
    } else {
      res.status(404).json("No delivery occur yet !");
    }
  } catch (err) {
    await log(err);
    res.status(500).json(err);
  }
};
