const Order = require("../models/Orders");
const Run = require("../models/Run");
const { log } = require("../helpers/Loger");
const moment = require("moment");
const { getComingRuns } = require("./runs");
const { getCostumerInternally } = require("./costumer");

exports.createOrder = async (req, res) => {
  const createNewRun = async (orderDate, newOrder, customerRouteId) => {
    const newRun = new Run({
      date: orderDate,
      orders: [newOrder],
      route: customerRouteId,
    });
    const savedRun = await newRun.save();
    return res.status(200).json({ message: "New run is created", savedRun });
  };
  const { date, customer } = req.body;
  try {
    const newOrder = await Order.create(req.body);

    let ourCustomer = await getCostumerInternally(customer);

    if (!ourCustomer)
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });
    let customerRouteId = ourCustomer.routeId.toString();
    const comingRunsArray = await getComingRuns(customerRouteId);
    // we are getting the runs with status 0 and 1 so we have to terminate runs by end of day if the admin did not
    //wen badna nhetetla coda hayde ya Emile
    let orderDate = moment(date).format("L");

    if (!comingRunsArray.length)
      return createNewRun(orderDate, newOrder, customerRouteId);

    for (let i = 0; i < comingRunsArray.length; i++) {
      let runDates = comingRunsArray[i].date;
      let runDate = moment(runDates).format("L");
      let runRouteId = comingRunsArray[i].route.toString();

      if (runDate == orderDate && customerRouteId == runRouteId) {
        let runId = comingRunsArray[i]._id.toString();

        const ourRun = await Run.findByIdAndUpdate(
          runId,
          { $push: { orders: newOrder } },
          { new: true }
        );
        return res.status(200).json({
          message: "Order is added to already created run at that date",
          ourRun,
        });
      } else {
        createNewRun(orderDate, newOrder, customerRouteId);
      }
    }
  } catch (err) {
    console.log("createOrder err", err);
    await log(err);
    res.status(500).json(err);
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body,
      },
      { new: true }
    );
    if (updatedOrder) {
      res.status(200).json(updatedOrder);
    } else {
      res.status(404).json("No order was found with this id !");
    }
  } catch (err) {
    await log(err);
    res.status(500).json(err);
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.status(200).json("Order has been deleted...");
  } catch (err) {
    await log(err);
    res.status(500).json(err);
  }
};

exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)

      .populate({
        path: "products",
        populate: {
          path: "product",
          model: "Product",
        },
      })
      .exec();
    if (order) {
      res.status(200).json(order);
    } else {
      res.status(404).json("No order was found with this id !");
    }
  } catch (err) {
    console.log("err", err);
    await log(err);
    res.status(500).json(err);
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("customer")
      .populate({
        path: "products",
        populate: {
          path: "product",
          model: "Product",
        },
      })
      .exec();
    const orderCount = await Order.countDocuments();
    let objectTosend = {
      orderCount,
      orders,
    };
    if (orders) {
      res.status(200).json(objectTosend);
    } else {
      return res.status(200).json("No orders found");
    }
  } catch (err) {
    console.log("err", err);
    await log(err);
    res.status(500).json(err);
  }
};
