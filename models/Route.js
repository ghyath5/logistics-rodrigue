const mongoose = require("mongoose");

const RouteSchema = new mongoose.Schema(
  {
    name: { type: String },
    description: { type: String },
    places: [{ type: String }],
    note: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Route", RouteSchema);
