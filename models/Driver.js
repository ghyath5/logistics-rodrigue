const mongoose = require("mongoose");
const Run = require("./Run");

const DriverSchema = new mongoose.Schema(
  {
    name: { type: String },
    phone: { type: String },
    code: { type: String },
  },
  { timestamps: true }
);

DriverSchema.methods.isAvailable = async function () {
  try {
    const run = await Run.findOne({ driver: this._id, status: { $lte: 1 } });
    return !Boolean(run);
  } catch (e) {
    return true;
  }
};

module.exports = mongoose.model("Driver", DriverSchema);
