const Customer = require("../models/Customer");
const Vehicle = require("../models/Vehicle");
const Run = require("../models/Run");
const Order = require("../models/Orders");
const Sharedrecords = require("../models/Sharedrecords");
const Route = require("../models/Route");
const Organization = require("../models/Organization");
const { log } = require("../helpers/Loger");
const moment = require("moment");

const XeroHelper = require("../helpers/Xero");

// 63bfdcf93c0361cc932597cb
// 63bfdd3c3c0361cc932597d0
// 63bfdd633c0361cc932597d5
// 63bfdda23c0361cc932597da

exports.createCostumer = async (req, res) => {
  const { businessname, abn } = req.body;
  const newCustomer = new Customer(req.body);
  const codeSequence = await Sharedrecords.findById("63663fa59b531a420083d78f");
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
        "This businessname is already in use, please choose a different one",
    });
  }

  if (abn) {
    const abnUser = await Customer.findOne({ abn });
    if (abnUser) {
      return res.status(400).json({
        success: false,
        message: "This ABN is already in use, please choose a different one",
      });
    }
  }

  // const emailUser = await Customer.findOne({ email });
  // if (emailUser) {
  //   return res.status(400).json({
  //     success: false,
  //     message: "This email is already in use, try sign-in with a different one",
  //   });
  // }

  try {
    const savedCustomer = await newCustomer.save();
    await Route.findByIdAndUpdate(newCustomer.routeId, {
      $push: { customers: savedCustomer._id },
    });
    await XeroHelper.synchCustomerToXero(savedCustomer);
    res.status(200).json(savedCustomer);
    await Sharedrecords.findByIdAndUpdate(
      "63663fa59b531a420083d78f",
      {
        $inc: { customercodeid: 1 },
      },
      { new: true }
    );
  } catch (err) {
    console.log("createCostumer err", err);
    await log(err);
    res.status(500).json(err);
  }
};
exports.updateCostumer = async (req, res) => {
  const { promotions, businessname, abn } = req.body;

  try {
    if (promotions) {
    }

    const existsBusinessName = await Customer.findOne({
      businessname,
      _id: { $ne: req.params.id },
    });

    if (existsBusinessName) {
      return res.status(400).json({
        success: false,
        message:
          "This businessname is already in use, please choose a different one",
      });
    }

    if (abn) {
      const existsAbn = await Customer.findOne({
        abn,
        _id: { $ne: req.params.id },
      });
      if (existsAbn) {
        return res.status(400).json({
          success: false,
          message: "This ABN is already in use, please choose a different one",
        });
      }
    }

    const oldCustomer = await Customer.findById(req.params.id);

    const updatedCustomer = await Customer.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body,
      },
      { new: true }
    );
    if (updatedCustomer) {
      if (oldCustomer.preferredday !== updatedCustomer.preferredday) {
        await Customer.findByIdAndUpdate(req.params.id, {
          $unset: { "sheduledCall.date": 1 },
        });
      }

      const route = await Route.findOne({ customers: req.params.id });
      if (
        route &&
        route._id.toString() !== updatedCustomer.routeId.toString()
      ) {
        await Route.findByIdAndUpdate(route._id, {
          $pull: { customers: req.params.id },
        });
        await Route.findByIdAndUpdate(updatedCustomer.routeId, {
          $push: { customers: req.params.id },
        });
      }

      await XeroHelper.synchCustomerToXero(updatedCustomer);
      res.status(200).json(updatedCustomer);
    } else {
      res.status(404).json("no costumer was found with this id");
    }
  } catch (err) {
    console.log("updateCostumer err", err);
    await log(err);
    res.status(500).json(err);
    console.log("updateCostumer err", err);
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

    const deleterCustomer = await Customer.findByIdAndDelete(req.params.id);

    if (!deleterCustomer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    if (deleterCustomer.organization) {
      const organization = await Organization.findById(
        deleterCustomer.organization
      );
      if (organization) {
        const org = await Organization.findByIdAndUpdate(organization._id, {
          $pull: { customers: deleterCustomer._id },
        });
        if (!org.customers.length) {
          await Organization.findByIdAndDelete(organization._id);
        } else if (org.head.toString === deleterCustomer._id.toString) {
          await Organization.findByIdAndUpdate(organization._id, {
            $set: { head: org.customers[0] },
          });
        }
      }
    }

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
    const { page, limit, isarchived, organization } = req.query;
    if (!page || !limit || !isarchived)
      return res
        .status(400)
        .json(
          "the required query parameters are : page and limit and isarchived"
        );
    let customers = await Customer.find({
      isarchived: isarchived,
    })
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
          name: { $first: "$businessname" },
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

    const allVehicles = await Vehicle.find();
    let vehiclesToUpdate = [];
    for (let i = 0; i < allVehicles.length; i++) {
      if (allVehicles[i].expiresIn < myDate) {
        vehiclesToUpdate.push(allVehicles[i]);
      } else {
        continue;
      }
    }

    for (let i = 0; i < vehiclesToUpdate.length; i++) {
      await Vehicle.findByIdAndUpdate(vehiclesToUpdate[i]._id.toString(), {
        status: 0,
      });
    }

    let vehicles = allVehicles.filter((vehicle) => vehicle.status == 0);
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
exports.getCustomersToCall = async (req, res) => {
  try {
    const { routeId } = req.query;

    const filters = {};
    if (routeId) filters.routeId = routeId;

    const tomorrow = moment().add(1, "days").format("dddd").toLowerCase();

    const customers = await Customer.find({
      preferredday: tomorrow,
      isarchived: false,
      "deliveryoccur.number": { $ne: 0 },
      ...filters,
      $or: [
        { "sheduledCall.date": { $exists: false } },
        {
          "sheduledCall.date": {
            $lte: moment().endOf("day").toDate(),
            $gte: moment().startOf("day").toDate(),
          },
        },
        {
          "sheduledCall.date": {
            $lte: moment().subtract(1, "weeks").endOf("day").toDate(),
            $gte: moment().subtract(1, "weeks").startOf("day").toDate(),
          },
          "deliveryoccur.number": 1,
        },
        {
          "sheduledCall.date": {
            $lte: moment().subtract(2, "weeks").endOf("day").toDate(),
            $gte: moment().subtract(2, "weeks").startOf("day").toDate(),
          },
          "deliveryoccur.number": 2,
        },
      ],
    });

    for (let customer of customers) {
      customer.sheduledCall = {
        date: moment().toDate(),
        isCalled: customer.sheduledCall?.isCalled || false,
      };
      await customer.save();
    }

    res.status(200).json(customers);
  } catch (err) {
    console.log("getCustomersToCall err", err);
    await log(err);
    res.status(500).json(err);
  }
};
exports.toggleCall = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findById(id);
    if (!customer) return res.status(404).json("customer not found");

    customer.sheduledCall.isCalled = !customer.sheduledCall.isCalled;
    await customer.save();

    res.status(200).json(customer);
  } catch (err) {
    console.log("markAsCalled err", err);
    await log(err);
    res.status(500).json(err);
  }
};
exports.getAllNonOrganizationalCustomers = async (req, res) => {
  try {
    const { page, limit, find } = req.query;
    if (!page || !limit)
      return res
        .status(400)
        .json(
          "the required query parameters are page and limit and you can add find"
        );
    let customers;

    if (find) {
      customers = await Customer.find({
        $and: [
          {
            $or: [
              { businessname: { $regex: find, $options: "i" } },
              { firstname: { $regex: find, $options: "i" } },
              { abn: { $regex: find, $options: "i" } },
            ],
          },
          { organization: null },
        ],
      })
        .limit(limit * 1)
        .skip((page - 1) * limit);
    } else {
      customers = await Customer.find({ organization: null })
        .limit(limit * 1)
        .skip((page - 1) * limit);
    }

    if (customers) {
      res.status(200).json(customers);
    } else {
      return res.status(200).json("No customers found");
    }
  } catch (err) {
    await log(err);
    res.status(500).json(err);
  }
};
