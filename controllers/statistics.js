const Order = require("../models/Orders");
const User = require("../models/User");
const { log } = require("../helpers/Loger");
const dayjs = require("dayjs");
const moment = require("moment");

exports.getSalesByDay = async (req, res) => {
  const { date } = req.query;
  try {
    let yesterday = dayjs(date).subtract(1, "days");
    const myDate = new Date(date);
    const myYesterday = new Date(yesterday);

    const orders = await Order.aggregate([
      { $match: { date: { $gte: myYesterday, $lte: myDate } } },
    ]);
    let totalIncome = 0;
    for (let i = 0; i < orders.length; i++) {
      if (orders[i].status == 2)
        totalIncome = totalIncome + orders[i].totalamount;
    }
    res.status(200).json({ success: true, totalIncome });
  } catch (err) {
    await log(`getSalesByDay error : ${err}`);
    res.status(500).json(err);
  }
};
exports.getOrdersByUserId = async (req, res) => {
  let userId = req.params.id;
  try {
    const orders = await Order.find({ status: 0, initiateduser: userId });

    let totalIncome = 0;
    for (let i = 0; i < orders.length; i++) {
      totalIncome = totalIncome + orders[i].totalamount;
    }

    res.status(200).json({ success: true, totalIncome, orders });
  } catch (err) {
    await log(`getOrdersByUserId error : ${err}`);
    res.status(500).json(err);
  }
};
exports.getSalesMonth = async (req, res) => {
  const { date } = req.query;
  try {
    let yesterday = dayjs(date).subtract(1, "days");
    const myDate = new Date(date);
    const myYesterday = new Date(yesterday);

    const orders = await Order.aggregate([
      { $match: { date: { $gte: myYesterday, $lte: myDate } } },
    ]);
    let totalIncome = 0;
    for (let i = 0; i < orders.length; i++) {
      if (orders[i].status == 2)
        totalIncome = totalIncome + orders[i].totalamount;
    }
    res.status(200).json({ success: true, totalIncome });
  } catch (err) {
    await log(`getSalesMonth error : ${err}`);
    res.status(500).json(err);
  }
};
exports.getSalesByDateRange = async (req, res) => {
  try {
    const to1 = moment(new Date(req.query.to1));
    const to2 = moment(new Date(req.query.to2));
    const days = Number(req.query.days || 30);
    const previousPeriod1 = moment(to1).subtract(days, "days");
    const previousPeriod2 = moment(to2).subtract(days, "days");
    const orders = await Order.aggregate([
      {
        $match: {
          $or: [
            { date: { $gte: previousPeriod1.toDate(), $lte: to1.toDate() } },
            { date: { $gte: previousPeriod2.toDate(), $lte: to2.toDate() } },
          ],
          status: 2,
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          totalAmount: {
            $sum: "$totalamount",
          },
        },
      },
    ]);
    const labels = [];
    const dataset1 = [];
    const dataset2 = [];
    for (
      const m = moment(previousPeriod1.add(1, "days"));
      m.isSameOrBefore(to1);
      m.add(1, "days")
    ) {
      const d = m.date();
      labels.push(d);
      const order = orders.find((order) => {
        return order._id == m.format("YYYY-MM-DD");
      });
      dataset1.push(order?.totalAmount ?? 0);
    }
    for (
      const m = moment(previousPeriod2.add(1, "days"));
      m.isSameOrBefore(to2);
      m.add(1, "days")
    ) {
      const order = orders.find((order) => order._id == m.format("YYYY-MM-DD"));
      dataset2.push(order?.totalAmount ?? 0);
    }

    res.status(200).json({ labels, dataset1, dataset2 });
  } catch (err) {
    await log(`getSalesByDateRange error : ${err}`);
    res.status(500).json(err);
  }
};
exports.getSalesPerUser = async (req, res) => {
  try {
    const users = await User.find();
    for (let i = 0; i < users.length; i++) {
      const data = await Order.aggregate([
        {
          $match: {
            $and: [{ initiateduser: users[i]._id }, { status: 2 }],
          },
        },
      ]);
    }
  } catch (err) {
    await log(`getSalesPerUser error : ${err}`);
    res.status(500).json(err);
  }
};
