const moment = require("moment");

const Run = require("../models/Run");
const Route = require("../models/Route");
const Order = require("../models/Orders");
const { log } = require("../helpers/Loger");
const Vehicle = require("../models/Vehicle");
const XeroHelper = require("../helpers/Xero");
const Customer = require("../models/Customer");
const Organization = require("../models/Organization");
const Sharedrecords = require("../models/Sharedrecords");

exports.createCostumer = async (req, res) => {
  try {
    const { businessname, abn, email } = req.body;
    const newCustomer = new Customer(req.body);
    const codeSequence = await Sharedrecords.findById(
      process.env.SHARED_RECORDS_ID
    );
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

    const emailUser = await Customer.findOne({ email });
    if (emailUser) {
      return res.status(400).json({
        success: false,
        message:
          "This email is already in use, try sign-in with a different one",
      });
    }

    const savedCustomer = await newCustomer.save();
    await Route.findByIdAndUpdate(newCustomer.routeId, {
      $push: { customers: savedCustomer._id },
    });
    await XeroHelper.synchCustomerToXero(savedCustomer);
    res.status(200).json(savedCustomer);
    await Sharedrecords.findByIdAndUpdate(
      process.env.SHARED_RECORDS_ID,
      {
        $inc: { customercodeid: 1 },
      },
      { new: true }
    );
  } catch (err) {
    await log(`createCustomer error : ${err}`);
    res.status(500).json(err);
  }
};
exports.updateCostumer = async (req, res) => {
  try {
    const { businessname, abn } = req.body;
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
      const oldRoute = await Route.findOne({ customers: req.params.id });
      const newRoute = await Route.findById(updatedCustomer.routeId);
      if (updatedCustomer.routeId) {
        await Route.findByIdAndUpdate(updatedCustomer.routeId, {
          $push: { customers: req.params.id },
        });
        await XeroHelper.addContactToGroupXero(
          updatedCustomer.xeroid,
          newRoute.xeroid
        );
      }
      if (
        oldRoute &&
        oldRoute._id.toString() !== updatedCustomer.routeId.toString()
      ) {
        await Route.findByIdAndUpdate(oldRoute._id, {
          $pull: { customers: req.params.id },
        });
        await XeroHelper.removeContactFromGroupXero(
          updatedCustomer.xeroid,
          oldRoute.xeroid
        );
      }

      await XeroHelper.synchCustomerToXero(updatedCustomer);
      return res.status(200).json(updatedCustomer);
    } else {
      return res.status(404).json("no costumer was found with this id");
    }
  } catch (err) {
    await log(`updateCostumer error : ${err}`);
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
    await log(`deleteCostumer error : ${err}`);
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
    await log(`getCostumer error : ${err}`);
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
    await log(`getCostumerInternally error : ${err}`);
    res.status(500).json(err);
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
    await log(`getCostumerPaginatedArchived error : ${err}`);
    res.status(500).json(err);
  }
};
exports.findCustomerByTextSearch = async (req, res) => {
  try {
    const { find, page, limit } = req.query;
    const found = await Customer.find({
      $or: [
        { codeid: { $regex: find, $options: "i" } },
        { businessname: { $regex: find, $options: "i" } },
        { firstname: { $regex: find, $options: "i" } },
        { lastname: { $regex: find, $options: "i" } },
      ],
    })
      .sort("businessname")
      .limit(limit * 1)
      .skip((page - 1) * limit);

    if (!found) return res.status(404).json("no customer was found");
    return res.status(200).json(found);
  } catch (err) {
    await log(`findCustomerByTextSearch error : ${err}`);
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
    return res.json({
      data: totalOrdersAmount,
      labels: names,
      todayRuns,
      todayOrders,
      todayDeliveredOrders,
      vehicles,
    });
  } catch (err) {
    await log(`getTopCustomers error : ${err}`);
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
    await log(`toggleCall error : ${err}`);
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
    await log(`getAllNonOrganizationalCustomers error : ${err}`);
    res.status(500).json(err);
  }
};
