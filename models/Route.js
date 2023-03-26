const mongoose = require("mongoose");

const RouteSchema = new mongoose.Schema(
  {
    name: { type: String },
    description: { type: String },
    from: { type: String },
    to: { type: String },
    places: { type: Array },
    customers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Route", RouteSchema);
