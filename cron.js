const cron = require("node-cron");
const moment = require("moment");
const Run = require("./models/Run");
const Orders = require("./models/Orders");
const Customer = require("./models/Customer");
console.log("initalized");

cron.schedule("0 0 * * *", async () => {
  try {
    const runs = await Run.find({
      date: { $lt: moment(new Date()).toDate() },
      status: { $lte: 1 },
    });
    if (!runs?.length) return;
    const ordersIDs = [];
    const ids = runs.map((run) => {
      ordersIDs.push(...run.orders);
      return run._id;
    });
    const updateRuns = Run.updateMany(
      {
        _id: { $in: ids },
      },
      { $set: { status: 2 } }
    );
    const updateOrders = Orders.updateMany(
      {
        _id: { $in: ordersIDs },
      },
      { $set: { status: 2 } }
    );
    await Promise.all([updateRuns, updateOrders]);
  } catch {}
});

cron.schedule("0 1 * * *", async () => {
  try {
    const tomorrow = moment().add(1, "days").format("dddd").toLowerCase();

    const customers = await Customer.find({
      preferredday: tomorrow,
      isarchived: false,
      "deliveryoccur.number": { $ne: 0 },
      $or: [
        { sheduledCall: { $exists: false } },
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
        isCalled: false,
      };
      await customer.save();
    }
  } catch {}
});
