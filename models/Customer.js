const mongoose = require("mongoose");

const CustomerSchema = new mongoose.Schema(
  {
    codeid: { type: String, required: true },
    businessname: { type: String, required: true },
    address: { type: [String], required: true },
    isarchived: { type: Boolean, default: false },
    suburb: { type: String, required: true },
    notes: { type: String },
    ispricingdefault: { type: Boolean, required: true, default: true },
    customername: { type: String, required: true },
    email: { type: String },
    abn: { type: String },
    phonenumber: { type: String, required: true },
    mobilenumber: { type: String },
    directdialnumber: { type: String },
    state: { type: String, required: true },
    postcode: { type: Number, required: true },
    deliveryoccur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Deliveriesoccur",
      required: true,
    },
    preferredtimes: [
      {
        day: { type: String },
        daystoremind: { type: Number },
        from: { type: Date },
        to: { type: Date },
      },
    ],
    paymentmethod: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Paymentmethod",
      required: true,
    },
    routeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Route",
    },
    isconsolidatedbiller: { type: Boolean, required: true },
    billerforcustomer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Biller",
    },
    promotions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Promotion",
      },
    ],
  },
  { timestamps: true }
);

CustomerSchema.statics.isThisBusinessNameInUse = async function (businessname) {
  if (!businessname)
    throw new Error("Please ente a business name for the product");
  try {
    const product = await this.findOne({ businessname });
    if (product) return false;
    return true;
  } catch (error) {
    console.error(`error inside isThisCodeInUse method`, error.message);
    return false;
  }
};

CustomerSchema.statics.isThisEmailInUse = async function (email) {
  if (!email) throw new Error("Please ente an email for this customer");
  try {
    const customer = await this.findOne({ email });
    if (customer) return false;
    return true;
  } catch (error) {
    console.error(`error inside isThisCodeInUse method`, error.message);
    return false;
  }
};

module.exports = mongoose.model("Customer", CustomerSchema);
