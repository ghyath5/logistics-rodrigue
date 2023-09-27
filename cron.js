const cron = require("node-cron");
const moment = require("moment");
const Route = require("./models/Route");
const CallLog = require("./models/callLog");
const CronScheduler = require("./models/CronScheduler");

console.log("initialized");

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
const routeCronSchedule = cron.schedule("0 1 */14 * *", async () => {
  const cronScheduler = await CronScheduler.findOne();
  if (!cronScheduler) {
    await CronScheduler.create({
      lastRouteCleanup: new Date(),
    });
  } else {
    cronScheduler.lastRouteCleanup = new Date();
    await cronScheduler.save();
  }
  runRouteCleanupTask();
});

// Initially, routeCronSchedule is not started
routeCronSchedule.stop();

// Weekly cron job to check if it's Monday at 2 am
const weeklyCronSchedule = cron.schedule("0 2 * * 1", async () => {
  const today = new Date();
  if (today.getDay() === 1) {
    // monday, so start the route cleanup job and stop the weekly job
    routeCronSchedule.start();
    weeklyCronSchedule.stop();
  }
});
