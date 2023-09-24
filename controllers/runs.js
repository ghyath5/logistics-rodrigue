const mongoose = require("mongoose");
const Run = require("../models/Run");
const { log } = require("../helpers/Loger");
const Orders = require("../models/Orders");
const moment = require("moment");

const Xero = require("../helpers/Xero");

// Now you can access ObjectId through mongoose
const ObjectId = mongoose.Types.ObjectId;

// Example of using ObjectId
exports.createRun = async (req, res) => {
  try {
    const newRun = new Run(req.body);
    const savedRun = await newRun.save();
    res.status(200).json(savedRun);
  } catch (err) {
    await log(`createRun error : ${err}`);
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
    await log(`updateRun error : ${err}`);
    res.status(500).json(err);
  }
};
exports.deleteRun = async (req, res) => {
  try {
    await Run.findByIdAndDelete(req.params.id);
    res.status(200).json("Run has been deleted...");
  } catch (err) {
    await log(`deleteRun error : ${err}`);
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
    await log(`getRun error : ${err}`);
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
    await log(`getComingRuns error : ${err}`);
    res.status(500).json(err);
  }
};
exports.getAllComingRuns = async () => {
  try {
    const runs = await Run.find({ $or: [{ status: 0 }, { status: 1 }] });
    return runs || [];
  } catch (err) {
    await log(`getAllComingRuns error : ${err}`);
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
    await log(`getAllRuns error : ${err}`);
    res.status(500).json(err);
  }
};
exports.getRunPdf = async (req, res) => {
  try {
    const run = await Run.findById(req.params.id)
      .populate({
        path: "orders",
        populate: [
          {
            path: "customer",
            populate: { path: "paymentmethod" },
          },
          {
            path: "products.product",
          },
        ],
      })
      .populate("driver")
      .populate("vehicle");

    let pdfs = [];
    for (let i = 0; i < run.orders.length; i++) {
      const orderId = run.orders[i]._id;
      const buffer = await Xero.getInvoiceAsPdf(orderId);
      pdfs.push(buffer);
    }

    if (run) {
      res.status(200).json({
        run,
        pdfs,
      });
    } else {
      res.status(404).json("No run was found with this id !");
    }
  } catch (err) {
    await log(`getRunPdf error : ${err}`);
    res.status(500).json(err);
  }
};
exports.findRunByDriverIdOrDate = async (req, res) => {
  try {
    const { find, page, limit } = req.query;

    let query;
    if (ObjectId.isValid(find)) {
      query = { driver: new ObjectId(find) };
    } else {
      const parsedDate = new Date(find);
      console.log("parsedDate", parsedDate);
      if (!isNaN(parsedDate)) {
        query = {
          date: {
            $gte: moment(parsedDate).startOf("day").toDate(),
            $lte: moment(parsedDate).endOf("day").toDate(),
          },
        };
      } else {
        return res.status(400).json({ error: "Invalid query parameter" });
      }
    }

    const found = await Run.find(query)
      .populate("driver")
      .limit(limit * 1)
      .skip((page - 1) * limit);
    if (!found)
      return res
        .status(404)
        .json("no runs found for this driver or by this date");
    return res.status(200).json(found);
  } catch (err) {
    console.log("findRunByDriverIdOrDate err", err);
    await log(`findRunByDriverIdOrDate error : ${err}`);
    return res.status(500).json(err);
  }
};
