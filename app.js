const cors = require("cors");
const dotenv = require("dotenv");
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const compression = require("compression");

require("./cron");
const app = express();

require("./helpers/Xero");

const {
  authRoute,
  runsRoute,
  usersRoute,
  routeRoute,
  ordersRoute,
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
  accountRoute,
} = require("./routes");

dotenv.config();

const connectWithRetry = () => {
  mongoose
    .connect(process.env.MONGO_URL)
    .then(() => console.log("DB Connection Successfull!"))
    .catch((err) => {
      console.log(`DB Connection ${err}`);
      setTimeout(connectWithRetry, 5000);
    });
};

// special wrap
connectWithRetry();

app.use(cors());
app.use(compression());

app.use("/api/webhook", bodyParser.raw({ type: "application/json" }));
app.use(express.json());

app.use("/api/auth", authRoute);
app.use("/api/users", authRoute);
app.use("/api/drivers", driversRoute);
app.use("/api/runs", runsRoute);
app.use("/api/users", usersRoute);
app.use("/api/routes", routeRoute);
app.use("/api/orders", ordersRoute);
app.use("/api/products", productRoute);
app.use("/api/customers", costumerRoute);
app.use("/api/promotion", promotionRoute);
app.use("/api/categories", categoryRoute);
app.use("/api/paymentmethod", paymentMethodRoute);
app.use("/api/vehicles", vehiclesRoute);
app.use("/api/people", peopleRoute);
app.use("/api/organization", organizationRoute);
app.use("/api/statistics", statisticsRoute);
app.use("/api/webhook", webhookRoute);
app.use("/api/account", accountRoute);

app.listen(process.env.PORT || 5002, () => {
  console.log(`Server is running on port ${process.env.PORT || 5002}`);
});

// =========================
// OLD MONJAY SYSTEM CREDENTIALS :
// =========================
//
// https://monjay.app.qore.com.au
// admin@mjmezza.com.au
// Holden15
// =========================

// =========================
// TRIAL XERO ACCOUNT CREDENTIALS :
// =========================
//
// emileib.lb@gmail.com
// &YizQ2t.V@9U4/V
// =========================

// =========================
// PRODUCTION XERO ACCOUNT CREDENTIALS :
// =========================
//
// https://go.xero.com/app/!1Y5zX/dashboard&redirectCount=0&apToken=c3caaa7e-755e-4651-82cb-395645acd0ed
// USID = rodrick.abdallah@gmail.com
// PASS = pa$$w0rd
// ==========================
