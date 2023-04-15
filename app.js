const cors = require("cors");
const dotenv = require("dotenv");
const express = require("express");
const mongoose = require("mongoose");
const compression = require("compression");
require("./cron");
const app = express();
const bodyParser = require("body-parser");

// https://monjay.app.qore.com.au
//
//
// admin@mjmezza.com.au
// Holden15

// =========================

// https://go.xero.com/app/!1Y5zX/dashboard&redirectCount=0&apToken=c3caaa7e-755e-4651-82cb-395645acd0ed
// USID = rodrick.abdallah@gmail.com
// PASS = pa$$w0rd

const {
  authRoute,
  runsRoute,
  billersRoute,
  usersRoute,
  routeRoute,
  ordersRoute,
  deliveryOccurRoute,
  promotionRoute,
  paymentMethodRoute,
  productRoute,
  categoryRoute,
  costumerRoute,
  vehiclesRoute,
  peopleRoute,
  organizationRoute,
  statisticsRoute,
  driversRoute,
  webhookRoute,
} = require("./routes");

dotenv.config();

const connectWithRetry = () => {
  mongoose
    .connect(process.env.MONGO_URL || "mongodb://0.0.0.0:27017/monjay")
    .then(() => console.log("DB Connection Successfull!"))
    .catch((err) => {
      console.log(err);
      setTimeout(connectWithRetry, 5000);
    });
};
// special wrap ()
connectWithRetry();

app.use(cors());
app.use(compression());

app.use("/api/webhook", bodyParser.raw({ type: "application/json" }));
app.use(express.json());

app.use("/api/auth", authRoute);
app.use("/api/users", authRoute);
app.use("/api/drivers", driversRoute);
app.use("/api/runs", runsRoute);
app.use("/api/biller", billersRoute);
app.use("/api/users", usersRoute);
app.use("/api/routes", routeRoute);
app.use("/api/orders", ordersRoute);
app.use("/api/products", productRoute);
app.use("/api/customers", costumerRoute);
app.use("/api/promotion", promotionRoute);
app.use("/api/categories", categoryRoute);
app.use("/api/paymentmethod", paymentMethodRoute);
app.use("/api/deliveryoccur", deliveryOccurRoute);
app.use("/api/vehicles", vehiclesRoute);
app.use("/api/people", peopleRoute);
app.use("/api/organization", organizationRoute);
app.use("/api/statistics", statisticsRoute);
app.use("/api/webhook", webhookRoute);

app.listen(process.env.PORT || 5000, () => {
  console.log(`Server is running on port ${process.env.PORT || 5000}`);
});

const xeroHelper = require("./helpers/Xero");
// xeroHelper
//   .createCustomers()
//   .then(() => console.log("done"))
//   .catch((err) => console.log("Error:", err.response));

// xeroHelper.getCustomer("65646100-16b8-4922-bd73-b847828501ef");

// 200 : OK
// 201 : CREATED
// 400 : BAD REQUEST
// 401 : UNAUTHORIZED
// 403 : FORBIDDEN
// 404 : NOT FOUND

// title above all charts : products and sales analysis
// add notes to order creation
// top selling product
