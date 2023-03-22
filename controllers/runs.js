const Run = require("../models/Run");
const { log } = require("../helpers/Loger");
const Orders = require("../models/Orders");

exports.createRun = async (req, res) => {
  const newRun = new Run(req.body);
  try {
    const savedRun = await newRun.save();
    res.status(200).json(savedRun);
  } catch (err) {
    await log(err);
    res.status(500).json(err);
  }
};
exports.updateRun = async (req, res) => {
  try {
    const updatedRun = await Run.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body,
      },
      { new: true }
    ).populate("orders");

    const ordersIds = updatedRun.orders.map((order) => order._id?.toString());
    
    if (updatedRun.status >= 2) {
      await Orders.updateMany(
        {
          _id: { $in: ordersIds },
        },
        { $set: { status: updatedRun.status } }
      );
    }

    // update all orders date in that run
    if (updatedRun.date) {
      await Orders.updateMany(
        {
          _id: { $in: ordersIds },
        },
        { $set: { date: updatedRun.date } }
      );
    }

    if (updatedRun) {
      res.status(200).json(updatedRun);
    } else {
      res.status(404).json("No run was found with this id !");
    }
  } catch (err) {
    await log(err);
    res.status(500).json(err);
  }
};
exports.deleteRun = async (req, res) => {
  try {
    await Run.findByIdAndDelete(req.params.id);
    res.status(200).json("Run has been deleted...");
  } catch (err) {
    await log(err);
    res.status(500).json(err);
  }
};
exports.getRun = async (req, res) => {
  try {
    const run = await Run.findById(req.params.id)
      .populate({
        path: "orders",
        populate: { path: "customer" },
      })
      .populate("driver")
      .populate("vehicle");

    if (run) {
      res.status(200).json(run);
    } else {
      res.status(404).json("No run was found with this id !");
    }
  } catch (err) {
    await log(err);
    res.status(500).json(err);
  }
};
exports.getComingRuns = async (routeId) => {
  try {
    const run = await Run.find({
      $and: [{ $or: [{ status: 0 }, { status: 1 }] }, { route: routeId }],
    });

    if (run) {
      return run;
    } else {
      return [];
    }
  } catch (err) {
    console.log("getComingRuns err", err);
  }
};
exports.getAllComingRuns = async () => {
  try {
    const runs = await Run.find({ $or: [{ status: 0 }, { status: 1 }] });
    return runs || [];
  } catch (err) {
    console.log("getComingRuns err", err);
    return [];
  }
};
exports.getAllRuns = async (req, res) => {
  try {
    const runs = await Run.find()
      .sort({ date: -1 })
      .populate("route")
      .populate("orders")
      .populate("driver", { name: 1 })
      .populate("vehicle");
    const runCount = await Run.countDocuments();
    let objectTosend = {
      runCount,
      runs,
    };
    if (runs) {
      res.status(200).json(objectTosend);
    } else {
      return res.status(200).json("No runs found");
    }
  } catch (err) {
    await log(err);
    res.status(500).json(err);
  }
};
