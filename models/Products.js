const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    assignedCode: { type: String },
    generatedCode: { type: String },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    price: { type: Number, required: true },
    promotionPrice: { type: Number },
    unitesperbox: { type: Number, required: true },
    prioritynumber: { type: Number, default: 0 },
    visibility: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", ProductSchema);
