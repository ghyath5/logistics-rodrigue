const mongoose = require("mongoose");

const PaymentMethodSchema = new mongoose.Schema(
  {
    number: { type: Number },
    name: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Paymentmethod", PaymentMethodSchema);
