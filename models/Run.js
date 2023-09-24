const mongoose = require("mongoose");
const Driver = require("./Driver");
const Vehicle = require("./Vehicle");
const moment = require("moment");

const RunSchema = new mongoose.Schema(
  {
    route: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Route",
    },
    date: { type: Date },
    note: { type: String },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: "Driver" },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle" },
    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
      },
    ],
  },
  { timestamps: true }
);

RunSchema.pre("insertMany", async function (done, docs) {
  for (const doc of docs) {
    if (!doc.driver) {
      const driver = await mongoose
        .model("Run", RunSchema)
        .getRandomAvailableVehicle(doc.date);
      doc.driver = driver;
    }
    if (!doc.vehicle) {
      let vehicle = await mongoose
        .model("Run", RunSchema)
        .getRandomAvailableVehicle(doc.date);
      doc.vehicle = vehicle;
    }
  }
  return done();
});

RunSchema.pre("save", async function (done) {
  if (!this.isNew) return done();
  if (!this.vehicle) {
    let vehicle = await mongoose
      .model("Run", RunSchema)
      .getRandomAvailableVehicle(this.date);
    this.vehicle = vehicle;
  }
  if (!this.driver) {
    let driver = await mongoose
      .model("Run", RunSchema)
      .getRandomAvailableDriver(this.date);
    this.driver = driver;
  }
  return done();
});

RunSchema.statics.getRandomAvailableVehicle = async function (runDate) {
  try {
    const runs = await this.find({
      date: { $ne: moment(runDate).toDate() },
    }).populate("vehicle");
    let availableVehicles = runs
      .map((run) => run?.vehicle?._id)
      .filter((v) => v);
    const allNotAssociatedVehicles = await Vehicle.aggregate([
      {
        $lookup: {
          from: "runs",
          foreignField: "vehicle",
          localField: "_id",
          as: "runs",
        },
      },

      {
        $match: {
          $or: [{ runs: { $exists: false } }, { runs: { $size: 0 } }],
        },
      },
    ]);
    availableVehicles = [
      ...allNotAssociatedVehicles.map((vehicle) => vehicle._id),
      ...availableVehicles,
    ];
    const vehicle =
      availableVehicles[Math.floor(Math.random() * availableVehicles.length)];
    return vehicle;
  } catch (e) {
    return null;
  }
};

RunSchema.statics.getRandomAvailableDriver = async function (runDate) {
  try {
    const runs = await this.find({
      date: { $ne: moment(runDate).toDate() },
    }).populate("driver");
    let availableDrivers = runs.map((run) => run?.driver?._id).filter((v) => v);
    const allNotAssociatedDrivers = await Driver.aggregate([
      {
        $lookup: {
          from: "runs",
          foreignField: "driver",
          localField: "_id",
          as: "runs",
        },
      },

      {
        $match: {
          $or: [{ runs: { $exists: false } }, { runs: { $size: 0 } }],
        },
      },
    ]);
    availableDrivers = [
      ...allNotAssociatedDrivers.map((driver) => driver._id),
      ...availableDrivers,
    ];
    const driver =
      availableDrivers[Math.floor(Math.random() * availableDrivers.length)];
    return driver;
  } catch (e) {
    console.log(e);
    return null;
  }
};

module.exports = mongoose.model("Run", RunSchema);
