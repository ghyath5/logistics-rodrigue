const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema(
  // status 0: pending
  // status 1: confimred
  // status 2: done
  // status 3: canceled
  {
    invoiceid: { type: String },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    initiateduser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        quantity: {
          type: Number,
          default: 1,
        },
        pricePerUnit: { type: Number, default: 0 },
      },
    ],
    totalamount: { type: Number },
    date: { type: Date },
    notes: { type: String },
    status: { type: Number, default: 0 },
    automaticallyGenerated: {
      type: Boolean,
      default: false,
    },
    deliveryOccured: {
      type: Boolean,
      default: false,
    },
    isBackOrder: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", OrderSchema);
