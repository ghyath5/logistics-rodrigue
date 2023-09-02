const mongoose = require("mongoose");

const CallLogSchema = new mongoose.Schema(
  {
    startDay: {
      type: Date,
    },
    endDay: {
      type: Date,
    },
    route: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Route",
    },
    customersCalled: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("CallLog", CallLogSchema);
