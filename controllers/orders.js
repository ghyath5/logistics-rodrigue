const Order = require("../models/Orders");
const User = require("../models/User");
const Run = require("../models/Run");
const { log } = require("../helpers/Loger");
const { getComingRuns, getAllComingRuns } = require("./runs");
const { getCostumerInternally } = require("./costumer");
const Customer = require("../models/Customer");
const Products = require("../models/Products");
const moment = require("moment");
const { default: mongoose } = require("mongoose");
const Orders = require("../models/Orders");
const xl = require("excel4node");
const { get, isFunction } = require("lodash");

exports.sendCustomeIdToCreateOrder = async (req, res) => {
  try {
    const find = req.query?.find || "";
    const page = req.query?.page || 1;
    const limit = req.query?.limit || 30;

    const customer = await Customer.findById(req.params.id).populate({
      path: "promotions",
      match: {
        from: { $lte: new Date() },
        to: { $gte: new Date() },
      },
    });
    if (!customer) {
      return res
        .status(404)
        .json({ success: false, message: "No customer is found by this Id!" });
    }
    let products = await Products.find({
      $and: [
        {
          $or: [
            { name: { $regex: find, $options: "i" } },
            {
              assignedCode: { $regex: find, $options: "i" },
            },
          ],
        },
        { visibility: true },
      ],
    })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    if (!customer?.promotions?.length) {
      return res.status(200).json({
        success: true,
        message: "The customer doesn't have any promotions",
        data: products,
      });
    }
    let categoryDiscounts = [];
    let productsDiscounts = [];
    customer.promotions.forEach((prom) => {
      if (prom.categorypromotion?.categoryId) {
        categoryDiscounts.push({
          categoryId: prom?.categorypromotion?.categoryId,
          discountpercentage: prom?.categorypromotion?.discountpercentage,
        });
      }
      if (prom?.productspromotion?.length) {
        productsDiscounts = prom?.productspromotion?.map(
          ({ productId, newprice }) => ({ productId, newprice })
        );
      }
    });
    products = products.map((product) => {
      const newProduct = { ...product };
      const categoryDiscount = categoryDiscounts.find(
        (catDiscount) =>
          catDiscount?.categoryId &&
          catDiscount.categoryId.toString() == product?.categoryId?.toString()
      );
      const productDiscount = productsDiscounts.find(
        (prodDiscount) =>
          prodDiscount?.productId &&
          prodDiscount.productId.toString() == product?._id?.toString()
      );
      if (categoryDiscount?.discountpercentage) {
        newProduct.promotionPrice =
          product.price * ((100 - categoryDiscount.discountpercentage) / 100);
      }
      if (productDiscount) {
        newProduct.promotionPrice =
          productDiscount?.newprice ?? newProduct.price;
      }
      return newProduct;
    });

    return res.status(200).json({
      success: true,
      message:
        "The products' new prices are computated as for the customer's promotions",
      data: products,
    });
  } catch (err) {
    console.log("sendCustomeIdToCreateOrder err", err);
    await log(err);
    res.status(500).json(err);
  }
};
exports.createOrder = async (req, res) => {
  console.clear();
  const createNewRun = async (orderDate, newOrder, customerRouteId) => {
    const newRun = new Run({
      date: orderDate,
      orders: [newOrder],
      route: customerRouteId,
    });
    const savedRun = await newRun.save();
    return savedRun;
  };

  const updateCustomerOrdeCount = async (customer) => {
    await Customer.findByIdAndUpdate(
      customer,
      {
        $inc: { totalOrders: 1 },
      },
      { new: true }
    );
  };

  const updateUserOrdeCount = async (user) => {
    await User.findByIdAndUpdate(
      user,
      {
        $inc: { ordersCount: 1 },
      },
      { new: true }
    );
  };
  const { date, customer, products } = req.body;

  try {
    const newOrder = new Order(req.body);
    let amount = 0;
    for (let j = 0; j < products.length; j++) {
      let quantity = products[j].quantity;
      let pricePerUnit = products[j].pricePerUnit;
      amount = quantity * pricePerUnit + amount;
    }
    let ourCustomer = await getCostumerInternally(customer);
    newOrder.totalamount = amount + ourCustomer.deliveryfee;
    newOrder.initiateduser = req.user.id.toString();
    await newOrder.save();
    updateCustomerOrdeCount(customer);
    updateUserOrdeCount(req.user.id.toString());

    if (!ourCustomer)
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });
    let customerRouteId = ourCustomer.routeId.toString();
    const comingRunsArray = await getComingRuns(customerRouteId);
    let orderDate = moment(date).format("L");

    const existComingRun = comingRunsArray.find((oneComingRun) => {
      let formattedRunDate = moment(oneComingRun.date).format("L");
      let runRouteId = oneComingRun.route.toString();
      return formattedRunDate == orderDate && runRouteId == customerRouteId;
    });

    if (existComingRun) {
      let runId = existComingRun._id.toString();
      const ourRun = await Run.findByIdAndUpdate(
        runId,
        { $push: { orders: newOrder } },
        { new: true }
      );
      return res.status(200).json({
        message: "Order is added to already created run at that date",
        ourRun,
      });
    }
    const ourRun = await createNewRun(orderDate, newOrder, customerRouteId);
    return res.status(200).json({ message: "New run is created", ourRun });
  } catch (err) {
    console.log("createOrder err", err);
    await log(err);
    res.status(500).json(err);
  }
};
exports.updateOrder = async (req, res) => {
  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body,
      },
      { new: true }
    )
      .populate("customer")
      .populate({
        path: "products",
        populate: {
          path: "name",
          model: "Product",
        },
      });

    if (updatedOrder) {
      res.status(200).json(updatedOrder);
    } else {
      res.status(404).json("No order was found with this id !");
    }
  } catch (err) {
    console.log("updateOrder err", err);
    await log(err);
    res.status(500).json(err);
  }
};
exports.deleteOrder = async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.status(200).json("Order has been deleted...");
  } catch (err) {
    await log(err);
    res.status(500).json(err);
  }
};
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate({
        path: "products",
        populate: {
          path: "product",
          model: "Product",
        },
      })
      .exec();
    if (order) {
      res.status(200).json(order);
    } else {
      res.status(404).json("No order was found with this id !");
    }
  } catch (err) {
    console.log("err", err);
    await log(err);
    res.status(500).json(err);
  }
};
exports.getOrdersByDate = async (req, res) => {
  const { date } = req.query;
  try {
    let beginningOfDay = moment(date).toDate();
    let endingOfDay = moment(date).add(1, "days").toDate();
    const orders = await Order.find({
      date: {
        $gte: beginningOfDay,
        $lte: endingOfDay,
      },
    })
      .populate("customer")
      .populate("products");
    if (orders.length) {
      return res.status(200).json({ success: true, data: orders });
    } else {
      return res.status(200).json({ message: success, data: [] });
    }
  } catch (err) {
    console.log("getOrdersByDate err", err);
    await log(err);
    res.status(500).json(err);
  }
};
exports.getAllOrders = async (req, res) => {
  const { limit, page, done } = req.query;
  //all 0 1 2 3
  // done = true => 2
  // done = false => 0 1 2 3
  try {
    const orders =
      done === "all"
        ? await Order.find()
            .populate("customer")
            .populate({
              path: "products",
              populate: {
                path: "product",
                model: "Product",
              },
            })
            .sort({ date: 1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
        : done === "false"
        ? await Order.find({
            $or: [{ status: 0 }, { status: 1 }, { status: 3 }],
          })
            .populate("customer")
            .populate({
              path: "products",
              populate: {
                path: "product",
                model: "Product",
              },
            })
            .sort({ date: 1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
        : await Order.find({ status: 2 })
            .populate("customer")
            .populate({
              path: "products",
              populate: {
                path: "product",
                model: "Product",
              },
            })
            .sort({ date: 1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

    const orderCount = await Order.countDocuments();
    let objectTosend = {
      orderCount,
      orders,
    };
    if (orders) {
      res.status(200).json(objectTosend);
    } else {
      return res.status(200).json("No orders found");
    }
  } catch (err) {
    console.log("err", err);
    await log(err);
    res.status(500).json(err);
  }
};
exports.searchOrderByProductText = async (req, res) => {
  const { name } = req.query;
  const isDate = moment(name, "", true).isValid();
  try {
    let findQuery = {};
    if (!isDate) {
      const productsIDSQuery = await Products.find({
        $or: [
          { name: { $regex: name, $options: "i" } },
          {
            assignedCode: { $regex: name, $options: "i" },
          },
        ],
      }).select("_id");
      const customersIDSQuery = await Customer.find({
        $or: [
          { customername: { $regex: name, $options: "i" } },
          {
            businessname: { $regex: name, $options: "i" },
          },
        ],
      }).select("_id");

      const [productsIDS, customersIDS] = await Promise.all([
        productsIDSQuery,
        customersIDSQuery,
      ]);
      const productsPureIDS = productsIDS.map(({ _id }) => _id.toString());
      const customersPureIDS = customersIDS.map(({ _id }) => _id.toString());
      findQuery = {
        $or: [
          {
            customer: { $in: customersPureIDS },
          },
          {
            "products.product": { $in: productsPureIDS },
          },
        ],
      };
    } else {
      findQuery = { date: moment(name).format("L") };
    }
    const orders = await Order.find(findQuery)
      .populate("customer")
      .populate("products.product")
      .sort({ date: 1 });
    res.status(200).json(orders);
  } catch (err) {
    console.log("searchOrderByProductText err", err);
  }
};
exports.executeDeliveryOccur = async (req, res) => {
  try {
    const today = new Date();
    const myToday = new Date(today);
    const oneWeekAgo = moment(myToday).subtract(7, "days").toDate();
    const twoWeeksAgo = moment(myToday).subtract(14, "days").toDate();

    const orders = await Order.aggregate([
      {
        $lookup: {
          from: "customers",
          localField: "customer",
          foreignField: "_id",
          as: "customerObject",
        },
      },
      {
        $unwind: {
          path: "$customerObject",
        },
      },
      {
        $lookup: {
          from: "deliveriesoccurs",
          localField: "customerObject.deliveryoccur",
          foreignField: "_id",
          as: "customerObject.deliveryoccur",
        },
      },
      {
        $unwind: {
          path: "$customerObject.deliveryoccur",
        },
      },
      {
        $match: {
          $or: [
            {
              date: { $gte: twoWeeksAgo, $lte: new Date() },
              "customerObject.deliveryoccur.number": 2,
            },
            {
              date: { $gte: oneWeekAgo, $lte: new Date() },
              "customerObject.deliveryoccur.number": 1,
            },
          ],
          status: 2, // only done orders
          deliveryOccured: false, ///
        },
      },
    ]);

    const ordersIDS = orders.map((order) => order._id.toString()); // get pure orders ids
    const updateOrdersDeliveryQuery = Order.updateMany(
      // update orders deliveryOccured to avoid duplication same order multiple times
      {
        _id: { $in: ordersIDS },
      },
      {
        $set: {
          deliveryOccured: true,
        },
      }
    );

    const [allRuns] = await Promise.all([
      getAllComingRuns(), //get all Runs to check
      updateOrdersDeliveryQuery,
    ]);

    const bulkUpsertOps = [];
    const inserts = [];

    const ordersToCreate = [...orders].map((current) => {
      let order = { ...current }; //clone current order
      order._id = new mongoose.Types.ObjectId(); //generate new Order Object Id

      if (!order?.customerObject) return order;
      if (order.customerObject?.deliveryoccur?.number == 2) {
        order.date = moment(order.date).add(14, "days").toDate(); // add 14 days to date if number is 2
      } else {
        order.date = moment(order.date).add(7, "days").toDate(); // add 7 days to date if number is 1
      }
      const formatedOrderDate = moment(order.date).format("L");
      const customerRouteId = order.customerObject?.routeId?.toString(); // customer route id from order customer object
      const existComingRun = allRuns.find((oneComingRun) => {
        // check existing coming run based on date and route id then return it
        if (!oneComingRun?.route || !oneComingRun?.date) return false;
        let formattedRunDate = moment(oneComingRun.date).format("L");
        let runRouteId = oneComingRun.route.toString();
        return (
          formattedRunDate == formatedOrderDate && runRouteId == customerRouteId
        );
      });
      if (existComingRun) {
        // if coming Run, update and push the new order id
        let runId = existComingRun._id.toString();
        bulkUpsertOps.push({
          updateOne: {
            filter: { _id: runId },
            update: { $push: { orders: order._id } },
            upsert: true,
          },
        });
      } else {
        // if not comin run, create new one with the new order id
        inserts.push({
          date: formatedOrderDate,
          orders: [order._id],
          route: customerRouteId,
        });
        // bulkUpsertOps.push({
        //   insertOne: {
        //     document: {
        //       date: formatedOrderDate,
        //       orders: [order._id],
        //       route: customerRouteId,
        //     },
        //   },
        // });
      }
      delete order.customerObject;
      order.status = 0;
      order.automaticallyGenerated = true;
      order.deliveryOccured = false;
      order.products = order.products.map((product) => {
        delete product._id;
        return product;
      });
      return order;
    });
    let createdOrders = await Order.insertMany(ordersToCreate);
    res.status(200).json({ orders: createdOrders }); //send created order to the client
    await Promise.all([Run.bulkWrite(bulkUpsertOps), Run.insertMany(inserts)]); // create or update Runs
  } catch (err) {
    console.log("err", err);
  }
};
exports.exportOrdersAsExcelFile = async (req, res) => {
  try {
    const from = moment(
      req.query?.from || moment(new Date()).subtract(30, "days")
    ).toDate();
    const to = moment(req.query?.to || moment(new Date()))
      .add(1, "days")
      .toDate();
    const orders = await Orders.find({
      status: 2,
      date: {
        $gte: from,
        $lte: to,
      },
    })
      .populate({
        path: "products",
        populate: {
          path: "product",
        },
      })
      .populate({
        path: "customer",
        populate: {
          path: "organization",
        },
        // select: { 'businessname': 1, customername: 1, 'organization.name': 1 }
      });

    const wb = new xl.Workbook();
    const ws = wb.addWorksheet("Orders");
    var orderFieldsStyle = wb.createStyle({
      font: {
        color: "#FFFFFF",
        size: 12,
      },
      fill: {
        type: "pattern",
        patternType: "solid",
        bgColor: "#000000",
        fgColor: "#000000",
      },
    });
    var productFieldsStyle = wb.createStyle({
      font: {
        color: "#000000",
        size: 12,
      },
      fill: {
        type: "pattern",
        patternType: "solid",
        bgColor: "#e1e1e1",
        fgColor: "#e1e1e1",
      },
    });
    const orderFields = [
      { name: "Code ID", value: "customer.codeid" },
      { name: "Business Name", value: "customer.businessname" },
      { name: "Customer Name", value: "customer.customername" },
      { name: "Phone Number", value: "customer.phonenumber" },
      { name: "Total Orders", value: "customer.totalOrders", type: "number" },
      { name: "Organization", value: "customer.organization.name" },
    ];
    const productFields = [
      { name: "Product Name", value: "product.name" },
      { name: "Qunatity", value: "quantity", type: "number" },
      {
        name: "Total",
        type: "number",
        value: (orderProd) =>
          orderProd.quantity *
          (orderProd.product?.promotionPrice || orderProd.product?.price),
      },
    ];
    orderFields.forEach((field, i) => {
      ws.cell(1, i + 1)
        .string(field.name)
        .style(orderFieldsStyle);
    });

    let row = 2; //starting after header row
    orders.forEach((order) => {
      orderFields.forEach((field, col) => {
        const val = isFunction(field.value)
          ? field.value(product)
          : get(order, field.value);
        const defaultVal = field.type == "number" ? 0 : "";
        ws.cell(row, col + 1)[field.type || "string"](val || defaultVal);
      });
      row++;
      productFields.forEach((field, col) => {
        ws.cell(row, col + 1)
          .string(field.name)
          .style(productFieldsStyle);
      });
      row++;
      order.products.forEach((product) => {
        productFields.forEach((field, col) => {
          const val = isFunction(field.value)
            ? field.value(product)
            : get(product, field.value);
          const defaultVal = field.type == "number" ? 0 : "";
          ws.cell(row, col + 1)
            [field.type || "string"](val || defaultVal)
            .style(productFieldsStyle);
        });
        row++;
        ws.cell(row, productFields.length)
          .number(order.totalamount || 0)
          .style(productFieldsStyle);
      });
      row += 2; //add two extra rows after each order
    });
    return wb.write("Orders.xlsx", res);
  } catch (e) {
    return res.status(400).json({ message: "cannot download the excel file" });
  }
};
