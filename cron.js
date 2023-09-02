const cron = require("node-cron");
const moment = require("moment");
const Run = require("./models/Run");
const Orders = require("./models/Orders");
const Customer = require("./models/Customer");
const Route = require("./models/Route");
const CallLog = require("./models/callLog");

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
        { "sheduledCall.date": { $exists: false } },
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

// Route schedule cleanup task
const runRouteCleanupTask = async () => {
  const routes = await Route.find();
  for (let route of routes) {
    if (route.scheduledDays?.calledCustomers) {
      await CallLog.create({
        startDay: moment().subtract(2, "weeks").startOf("day").toDate(),
        endDay: moment().subtract(1, "days").endOf("day").toDate(),
        route: route._id,
        calledCustomers: route.scheduledDays.calledCustomers,
      });

      route.scheduledDays.calledCustomers = [];
    }
    await route.save();
  }
};

// Cron job for the route cleanup (every 14 days at 1 am)
const routeCronSchedule = cron.schedule("0 1 */14 * *", () => {
  runRouteCleanupTask();
});

// Initially, routeCronSchedule is not started
routeCronSchedule.stop();

// Weekly cron job to check if it's Monday at 2 am
const weeklyCronSchedule = cron.schedule("0 2 * * 1", () => {
  const today = new Date();
  if (today.getDay() === 1) {
    // monday, so start the route cleanup job and stop the weekly job
    routeCronSchedule.start();
    weeklyCronSchedule.stop();
  }
});
