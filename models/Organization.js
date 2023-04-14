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
    // head of customers
  },
  { timestamps: true }
);

module.exports = mongoose.model("Organization", OrganizationSchema);
