const mongoose = require("mongoose");

const RouteSchema = new mongoose.Schema(
  {
    xeroid: { type: String, unique: true },
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
    scheduledDays: [
      // array of objects { day, customers }
      {
        // day should be a number raging 1 -> 14
        day: {
          type: Number,
          validate: {
            validator: function (v) {
              return v > 0 && v < 15;
            },
          },
        },
        // array of called customers
        calledCustomers: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Route", RouteSchema);
