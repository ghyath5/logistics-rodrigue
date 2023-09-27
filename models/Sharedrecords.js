const mongoose = require("mongoose");

const SharedrecordsSchema = new mongoose.Schema(
  {
    customercodeid: { type: Number },
    productcodeid: { type: Number },
    paymentmethodcodeid: { type: Number },
    drivercodeid: { type: Number },
    routeCron: {
      isFirstMonday: { type: Boolean },
      firstMondayDate: { type: Date },
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Sharedrecords", SharedrecordsSchema);
