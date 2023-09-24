const { log } = require("../helpers/Loger");
const Customer = require("../models/Customer");
const Sharedrecords = require("../models/Sharedrecords");
const Paymentmethod = require("../models/Paymentmethod");

exports.createPaymentMethod = async (req, res) => {
  try {
    const newPaymentmethod = new Paymentmethod(req.body);
    const codeSequence = await Sharedrecords.findById(
      process.env.SHARED_RECORDS_ID
    );
    let codeid = codeSequence.paymentmethodcodeid;
    newPaymentmethod.number = codeid;
    const paymentMethodName = await Paymentmethod.findOne({
      name: req.body.name,
    });
    if (paymentMethodName) {
      return res
        .status(403)
        .json("A payment method with this name has already been created");
    } else {
      const savedPaymentmethod = await newPaymentmethod.save();
      res.status(200).json(savedPaymentmethod);
      await Sharedrecords.findByIdAndUpdate(
        process.env.SHARED_RECORDS_ID,
        {
          $inc: { paymentmethodcodeid: 1 },
        },
        { new: true }
      );
    }
  } catch (err) {
    await log(`createPaymentMethod error : ${err}`);
    res.status(500).json(err);
  }
};
exports.updatePaymentMethod = async (req, res) => {
  try {
    const updatedPaymentMethod = await Paymentmethod.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body,
      },
      { new: true }
    );
    if (updatedPaymentMethod) {
      res.status(200).json(updatedPaymentMethod);
    } else {
      res.status(404).json("No payment Method found with this id");
    }
  } catch (err) {
    await log(`updatePaymentMethod error : ${err}`);
    res.status(500).json(err);
  }
};
exports.deletePaymentMethod = async (req, res) => {
  try {
    const customersWithThisPaymentmethod = Customer.find({
      paymentmethod: req.params.id,
    });

    if (customersWithThisPaymentmethod.length)
      return res
        .status(403)
        .json("Cannot delete a payment method associated with a customer");

    await Paymentmethod.findByIdAndDelete(req.params.id);
    res.status(200).json("Payment method has been deleted...");
  } catch (err) {
    await log(`deletePaymentMethod error : ${err}`);
    res.status(500).json(err);
  }
};
exports.getPaymentMethod = async (req, res) => {
  try {
    const paymentMethod = await Paymentmethod.findById(req.params.id);
    if (paymentMethod) {
      res.status(200).json(paymentMethod);
    } else {
      res.status(404).json("No payment method found with this id !");
    }
  } catch (err) {
    await log(`getPaymentMethod error : ${err}`);
    res.status(500).json(err);
  }
};
exports.getAllPaymentMethods = async (req, res) => {
  try {
    const paymentMethods = await Paymentmethod.find().sort({ _id: -1 });
    const paymentmethodCount = await Paymentmethod.countDocuments();
    let objectToSend = {
      paymentmethodCount,
      paymentMethods,
    };

    if (paymentMethods) {
      res.status(200).json(objectToSend);
    } else {
      res.status(404).json("No payment methods are created yet !");
    }
  } catch (err) {
    await log(`getAllPaymentMethods error : ${err}`);
    res.status(500).json(err);
  }
};
