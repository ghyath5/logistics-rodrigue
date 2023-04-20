const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    assignedCode: { type: String },
    generatedCode: { type: String },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    price: { type: Number, required: true },
    promotionPrice: { type: Number },
    unitesperbox: { type: Number },
    prioritynumber: { type: Number, default: 0 },
    visibility: { type: Boolean, default: true },
    isarchived: { type: Boolean, default: false },
    taxType: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", ProductSchema);
