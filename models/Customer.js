const mongoose = require("mongoose");

const CustomerSchema = new mongoose.Schema(
  {
    codeid: { type: String, required: true },
    xeroid: { type: String, unique: true },
    businessname: { type: String, required: true },
    address: { type: String },
    city: { type: String },
    region: { type: String },
    postcode: { type: String },
    isarchived: { type: Boolean, default: false },
    notes: { type: String },
    firstname: { type: String },
    lastname: { type: String },
    email: { type: String },
    abn: { type: String },
    phonenumber: { type: String },
    mobilenumber: { type: String },
    directdialnumber: { type: String },
    deliveryfee: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    paymentmethod: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Paymentmethod",
    },
    routeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Route",
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
    },
    promotions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Promotion",
      },
    ],
    sheduledCall: {
      date: { type: Date },
      isCalled: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Customer", CustomerSchema);
