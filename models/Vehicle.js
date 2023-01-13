const mongoose = require("mongoose");

const VehicleSchema = new mongoose.Schema(
  {
    plate: { type: String },
    model: { type: String },
    make: { type: String },
    color: { type: String },
    expiresIn: { type: Date },
    lastUsed: { type: Date },
    manufactureyear: { type: Number },
    status: { type: Number, default: 1 },
  },
  { timestamps: true }
);

VehicleSchema.methods.isAvailable = async function () {
  try {
    const run = await Run.exists({ vehicle: this._id, status: { $lte: 1 } });
    return !Boolean(run);
  } catch (e) {
    return true;
  }
};

module.exports = mongoose.model("Vehicle", VehicleSchema);
