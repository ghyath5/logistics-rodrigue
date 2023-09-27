const mongoose = require("mongoose");

const CronSchedulerSchema = new mongoose.Schema(
  {
    lastRouteCleanup: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CronScheduler", CronSchedulerSchema);
