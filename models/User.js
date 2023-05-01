const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phonenumber: { type: String, unique: true },
    lastlogin: { type: Date, default: null },
    role: { type: Number, default: 0 },
    ordersCount: { type: Number, default: 0 },
    theme: { type: Number, default: 0 },

    // role is 1 for all users (not customers), only one account is upper admin
    // and ahs his id in the .env
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
