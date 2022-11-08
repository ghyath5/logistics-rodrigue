const mongoose = require("mongoose");

const PaymentmethodSchema = new mongoose.Schema(
  {
    number: { type: Number },
    name: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Paymentmethod", PaymentmethodSchema);
