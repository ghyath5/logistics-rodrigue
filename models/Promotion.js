const mongoose = require("mongoose");

const PromotionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    from: { type: Date },
    to: { type: Date },
    categorypromotion: {
      categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
      discountpercentage: { type: Number },
    },
    productspromotion: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        newprice: { type: Number },
      },
    ],
  },
  { timestamps: true }
);

// PromotionSchema.pre("remove", function (next) {
//   // Remove all the assignment docs that reference the removed person.
//   this.model("Customer").remove({ promotions: this._id }, next);
// });

module.exports = mongoose.model("Promotion", PromotionSchema);
