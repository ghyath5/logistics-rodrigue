const mongoose = require("mongoose");

const OrganizationSchema = new mongoose.Schema(
  {
    name: { type: String },
    customers: [
      {
        customerId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Customer",
        },
      },
    ],
    head: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Organization", OrganizationSchema);
