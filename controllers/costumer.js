const Customer = require("../models/Customer");
const Vehicle = require("../models/Vehicle");
const Run = require("../models/Run");
const Order = require("../models/Orders");
const Sharedrecords = require("../models/Sharedrecords");
const { log } = require("../helpers/Loger");
const moment = require("moment");

// 63bfdcf93c0361cc932597cb
// 63bfdd3c3c0361cc932597d0
// 63bfdd633c0361cc932597d5
// 63bfdda23c0361cc932597da

exports.createCostumer = async (req, res) => {
  const { businessname, email } = req.body;
  const newCustomer = new Customer(req.body);
  const codeSequence = await Sharedrecords.findById("63c2de54a036aba6ceac44c4");
  let codeid = codeSequence.customercodeid;
  codeid = codeid.toString();

  while (codeid.length < 4) {
    codeid = "0" + codeid;
  }
  newCustomer.codeid = codeid;

  const businessnameUser = await Customer.findOne({ businessname });
  if (businessnameUser) {
    return res.status(400).json({
      success: false,
      message:
        "This businessname is already in use, try sign-in with a different one",
    });
  }

  const emailUser = await Customer.findOne({ email });
  if (emailUser) {
    return res.status(400).json({
      success: false,
      message: "This email is already in use, try sign-in with a different one",
    });
  }

  try {
    const savedCustomer = await newCustomer.save();
    res.status(200).json(savedCustomer);
    await Sharedrecords.findByIdAndUpdate(
      "63c2de54a036aba6ceac44c4",
      {
        $inc: { customercodeid: 1 },
      },
      { new: true }
    );
  } catch (err) {
    console.log("err", err);
    await log(err);
    res.status(500).json(err);
  }
};
exports.updateCostumer = async (req, res) => {
  const { promotions } = req.body;
  try {
    if (promotions) {
    }
    const updatedCustomer = await Customer.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body,
      },
      { new: true }
    );
    if (updatedCustomer) {
      res.status(200).json(updatedCustomer);
    } else {
      res.status(404).json("no costumer was found with this id");
    }
  } catch (err) {
    await log(err);
    res.status(500).json(err);
  }
};
exports.deleteCostumer = async (req, res) => {
  try {
    const ordersWithCustomer = await Order.find({ customer: req.params.id });
    if (ordersWithCustomer?.length)
      return res.status(403).json({
        success: false,
        message: "Cannot delete customer when associated to an order",
      });

    await Customer.findByIdAndDelete(req.params.id);
    return res.status(200).json({
      success: false,
      message: "Customer has been successfully deleted...",
    });
  } catch (err) {
    await log(err);
    res.status(500).json(err);
  }
};
exports.getCostumer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).populate(
      "promotions",
      { name: 1, _id: 1 }
    );
    if (customer) {
      res.status(200).json(customer);
    } else {
      res.status(404).json("no costumer was found with this id");
    }
  } catch (err) {
    await log(err);
    res.status(500).json(err);
  }
};
exports.getCostumerInternally = async (customerId) => {
  try {
    const customer = await Customer.findById(customerId);
    if (customer) {
      return customer;
    } else {
      console.log("no customer found");
    }
  } catch (err) {
    await log(err);
  }
};
exports.getCostumerPaginatedArchived = async (req, res) => {
  try {
    const customerCount = await Customer.countDocuments();
    const { page, limit, isarchived } = req.query;
    if (!page || !limit || !isarchived)
      return res
        .status(400)
        .json(
          "the required query parameters are : page and limit and isarchived"
        );
    let customers = await Customer.find({ isarchived: isarchived })
      .populate("paymentmethod")
      .sort("businessname")
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.status(200).json({ customerCount, customers });
  } catch (err) {
    console.log("err", err);
    await log(err);
    res.status(500).json(err);
  }
};
exports.findCustomerByTextSearch = async (req, res) => {
  const { find, page, limit } = req.query;

  try {
    const found = await Customer.find({
      $or: [
        { codeid: { $regex: find, $options: "i" } },
        { businessname: { $regex: find, $options: "i" } },
        { customername: { $regex: find, $options: "i" } },
      ],
    })
      .sort("businessname")
      .limit(limit * 1)
      .skip((page - 1) * limit);

    if (!found) return res.status(404).json("no customer was found");
    return res.status(200).json(found);
  } catch (err) {
    console.log("findCustomerByTextSearch err", err);
    await log(err);
    res.status(500).json(err);
  }
};
exports.getTopCustomers = async (req, res) => {
  // this controller returns aside the to the top customers
  // the order and runs scheduled to tomorrow for the dashboard
  try {
    const total = Number(req.query?.total) || 10;
    let topCustomers = await Customer.aggregate([
      {
        $lookup: {
          from: "orders",
          foreignField: "customer",
          localField: "_id",
          as: "orders",
        },
      },
      {
        $unwind: {
          path: "$orders",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          "orders.status": 2,
        },
      },
      {
        $group: {
          _id: "$_id",
          name: { $first: "$customername" },
          totalOrdersAmount: { $sum: "$orders.totalamount" },
        },
      },
      {
        $match: {
          totalOrdersAmount: { $gt: 0 },
        },
      },
      { $sort: { totalOrdersAmount: -1 } },
      { $limit: total },
    ]);
    const names = topCustomers.map((cust) => cust.name);
    const totalOrdersAmount = topCustomers.map(
      (cust) => cust.totalOrdersAmount
    );

    let date = new Date();
    const formattedDate = moment(date).format("L");
    const todayRunsArray = await Run.find({ date: formattedDate });
    const todayOrdersArray = await Order.find({ date: formattedDate });
    const todayDeliveredOrdersArray = await Order.find({
      date: formattedDate,
      status: 2,
    });
    let todayDeliveredOrders = todayDeliveredOrdersArray.length || 0;
    let todayOrders = todayOrdersArray.length || 0;
    let todayRuns = todayRunsArray.length || 0;

    let datee = new Date();
    let carefulDate = datee.setDate(datee.getDate() + 15);
    let myDate = new Date(carefulDate);

    const vehicles = await Vehicle.find();
    let vehiclesToUpdate = [];
    for (let i = 0; i < vehicles.length; i++) {
      if (vehicles[i].expiresIn < myDate) {
        vehiclesToUpdate.push(vehicles[i]);
      } else {
        continue;
      }
    }

    for (let i = 0; i < vehiclesToUpdate.length; i++) {
      await Vehicle.findByIdAndUpdate(vehiclesToUpdate[i]._id.toString(), {
        status: 0,
      });
    }

    res.json({
      data: totalOrdersAmount,
      labels: names,
      todayRuns,
      todayOrders,
      todayDeliveredOrders,
      vehicles,
    });
  } catch (err) {
    console.log("getTopCustomers err", err);
    await log(err);
    res.status(500).json(err);
  }
};
