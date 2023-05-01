const Route = require("../models/Route");
const Customer = require("../models/Customer");
const { log } = require("../helpers/Loger");
const mongoose = require("mongoose");

exports.createRoute = async (req, res) => {
  const { name } = req.body;
  const newRoute = new Route(req.body);
  try {
    const nameInUse = await Route.findOne({ name });
    if (nameInUse) {
      return res
        .status(399)
        .json({ success: false, message: "The route name already exists" });
    }

    // const { customers } = req.body;
    // if (customers) {
    //   for (let i = 0; i < customers.length; i++) {
    //     const customer = await Customer.findById(customers[i]);
    //     if (!customer) {
    //       return res.status(400).json({
    //         success: false,
    //         message: `Customer with id ${customers[i]} does not exist`,
    //       });
    //     }

    //     const route = await Route.findOne({ customers: customers[i] });
    //     if (route) {
    //       return res.status(400).json({
    //         success: false,
    //         message: `${customer.businessname} is already assigned to route ${route.name}`,
    //       });
    //     }
    //   }
    // }

    const savedRoute = await newRoute.save();

    // for (let i = 0; i < customers.length; i++) {
    //   await Customer.findByIdAndUpdate(customers[i], {
    //     $set: { routeId: savedRoute._id },
    //   });
    // }

    res.status(200).json(savedRoute);
  } catch (err) {
    console.log("createRoute err", err);
    await log(err);
    res.status(500).json(err);
  }
};
exports.updateRoute = async (req, res) => {
  try {
    const { customers } = req.body;
    if (customers && customers.length) {
      for (let i = 0; i < customers.length; i++) {
        const customer = await Customer.findById(customers[i]);
        if (!customer) {
          return res.status(400).json({
            success: false,
            message: `Customer with id ${customers[i]} does not exist`,
          });
        }
        const route = await Route.findOne({
          customers: customers[i],
          _id: { $ne: req.params.id },
        });
        if (route) {
          return res.status(400).json({
            success: false,
            message: `${customer.businessname} is already assigned to route ${route.name}`,
          });
        }
      }
    }

    const updatedRoute = await Route.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body,
      },
      { new: true }
    );

    if (updatedRoute && customers && customers.length) {
      for (let i = 0; i < customers.length; i++) {
        await Customer.findByIdAndUpdate(customers[i], {
          $set: { routeId: updatedRoute._id },
        });
      }
      return res.status(200).json(updatedRoute);
    }
    return res.status(200).json(updatedRoute);
  } catch (err) {
    await log(err);
    console.log("updateRoute err", err);
    res.status(500).json(err);
  }
};
exports.deleteRoute = async (req, res) => {
  try {
    const routeHasCustomers = await Customer.find({ routeId: req.params.id });

    if (routeHasCustomers.length)
      return res.status(403).json({
        success: false,
        message: "Route is associated with customers, cannot be deleted",
      });

    await Route.findByIdAndDelete(req.params.id);
    res.status(200).json("Route has been deleted...");
  } catch (err) {
    await log(err);
    res.status(500).json(err);
  }
};
exports.getRouteRoute = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id).populate("customers");
    if (route) {
      res.status(200).json(route);
    } else {
      res.status(404).json("No route was found with this id !");
    }
  } catch (err) {
    await log(err);
    res.status(500).json(err);
  }
};
exports.getAllRoutes = async (_req, res) => {
  try {
    const routes = await Route.find().populate("customers").sort({ _id: -1 });
    const routeCount = await Route.countDocuments();
    let objectTosend = {
      routeCount,
      routes,
    };
    if (routes) {
      res.status(200).json(objectTosend);
    } else {
      return res.status(200).json("No routes found");
    }
  } catch (err) {
    await log(err);
    res.status(500).json(err);
  }
};
