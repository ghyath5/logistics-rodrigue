const mongoose = require("mongoose");

// the id for this SharedRecords : 63663fa59b531a420083d78f
const SharedRecordsSchema = new mongoose.Schema(
  {
    customercodeid: { type: Number },
    productcodeid: { type: Number },
    billercodeid: { type: Number },
    paymentmethodcodeid: { type: Number },
    deliveryoccurcodeid: { type: Number },
    drivercodeid: { type: Number },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Sharedrecords", SharedRecordsSchema);
