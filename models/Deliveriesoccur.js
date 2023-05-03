const mongoose = require("mongoose");

const DeliveriesOccur = new mongoose.Schema(
  {
    number: { type: Number, default: 2 }, // 0 = manually, 1 = one per week, 2 = once per fortnight
    name: { type: String },
  },
  { timestamps: true }
);
module.exports = mongoose.model("Deliveriesoccur", DeliveriesOccur);
