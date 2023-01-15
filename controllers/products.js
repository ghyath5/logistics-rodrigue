const Products = require("../models/Products");
const Order = require("../models/Orders");
const { log } = require("../helpers/Loger");
const Sharedrecords = require("../models/Sharedrecords");
const Category = require("../models/Category");

const { default: mongoose } = require("mongoose");

exports.createproduct = async (req, res) => {
  const { name, categoryId, assignedCode } = req.body;

  if (!name || !categoryId) {
    return res.status(400).json("Please fill in all the fields");
  } else {
    const newProduct = new Products(req.body);

    try {
      const isNewProductCode = await Products.findOne({ assignedCode });
      if (isNewProductCode)
        return res.status(400).json({
          success: false,
          message:
            "This product assigned code is already in use, please enter a different one",
        });
      const productName = await Products.findOne({ name: req.body.name });
      if (productName) {
        return res
          .status(403)
          .json("a product with this name has already been created");
      } else {
        const codeSequence = await Sharedrecords.findById(
          "63c2de54a036aba6ceac44c4"
        );
        let codeid = codeSequence.productcodeid;
        codeid = codeid.toString();
        while (codeid.length < 4) {
          codeid = "0" + codeid;
        }
        newProduct.generatedCode = codeid;
        let savedProduct = await newProduct.save();
        res.status(200).json(savedProduct);
        await Sharedrecords.findByIdAndUpdate("63c2de54a036aba6ceac44c4", {
          $inc: { productcodeid: 1 },
        });
      }
    } catch (err) {
      console.log(err);
      await log(err);
      res.status(500).json(err);
    }
  }
};
exports.updateProduct = async (req, res) => {
  try {
    const updatedProduct = await Products.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body,
      },
      { new: true }
    );
    if (updatedProduct) {
      res.status(200).json(updatedProduct);
    } else {
      res.status(404).json("No product was found with this id !");
    }
  } catch (err) {
    await log(err);
    res.status(500).json(err);
  }
};
exports.deleteProduct = async (req, res) => {
  try {
    const productsFromOrder = await Order.aggregate([
      {
        $lookup: {
          from: "products",
          foreignField: "_id",
          localField: "products.product",
          as: "products",
        },
      },
      { $unwind: "$products" },
      {
        $match: {
          "products._id": { $eq: new mongoose.Types.ObjectId(req.params.id) },
        },
      },
      {
        $project: {
          _id: 1,
        },
      },
    ]);

    if (productsFromOrder.length)
      return res.status(403).json({
        success: false,
        message:
          "This Product cannot be deleted since it is associated with one or more orders",
      });

    await Products.findByIdAndDelete(req.params.id);
    return res.status(200).json({
      success: true,
      message: "This Product is successfully deleted",
    });
  } catch (err) {
    await log(err);
    res.status(500).json(err);
  }
};
exports.getProduct = async (req, res) => {
  try {
    const product = await Products.findById(req.params.id).populate(
      "categoryId"
    );
    if (product) {
      return res.status(200).json(product);
    } else {
      return res.status(404).json("No product was found with this id !");
    }
  } catch (err) {
    await log(err);
    res.status(500).json(err);
  }
};
exports.getproductsPaginated = async (req, res) => {
  try {
    let productsCount = await Products.countDocuments();
    let hiddenProducts = await Products.countDocuments({ visibility: false });
    let visibleProducts = productsCount - hiddenProducts;
    const { page = 1, limit = 5 } = req.query;
    const products = await Products.find()
      .populate("categoryId")
      .sort("name")
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res
      .status(200)
      .json({ productsCount, hiddenProducts, visibleProducts, products });
  } catch (err) {
    await log(err);
    res.status(500).json(err);
  }
};
exports.findProductsByTextSearch = async (req, res) => {
  const { find, page, limit } = req.query;
  try {
    const found = await Products.find({
      $or: [
        { name: { $regex: find, $options: "i" } },
        { assignedCode: { $regex: find, $options: "i" } },
      ],
    })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    if (!found) return res.status(404).json("No Products were found");
    return res.status(200).json(found);
  } catch (err) {
    console.log("err", err);
    await log(err);
    res.status(500).json(err);
  }
};
exports.getTopOrderedProducts = async (req, res) => {
  try {
    const total = Number(req.query?.total || 10);
    let topProducts = await Products.aggregate([
      {
        $lookup: {
          from: "orders",
          foreignField: "products.product",
          localField: "_id",
          as: "orders",
        },
      },
      {
        $unwind: {
          path: "$orders",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: "$orders.products",
      },
      {
        $group: {
          _id: "$_id",
          name: { $first: "$name" },
          totalOrdersQuantity: { $sum: "$orders.products.quantity" },
        },
      },
      { $sort: { totalOrdersQuantity: -1 } },
      { $limit: total },
    ]);
    const names = topProducts.map((prod) => prod.name);
    const ordersQuantity = topProducts.map((prod) => prod.totalOrdersQuantity);
    res.json({ data: ordersQuantity, labels: names });
  } catch (err) {
    await log(err);
    res.status(500).json(err);
  }
};
exports.getTopProductsByCategory = async (req, res) => {
  try {
    const total = Number(req.query?.total || 5);
    const topProducts = await Category.aggregate([
      {
        $lookup: {
          from: "products",
          foreignField: "categoryId",
          localField: "_id",
          let: { catId: "$_id" },
          pipeline: [
            {
              $match: { $expr: { $eq: ["$categoryId", "$$catId"] } },
            },
            {
              $lookup: {
                from: "orders",
                localField: "_id",
                foreignField: "products.product",
                as: "product.orders",
              },
            },
            {
              $unwind: {
                path: "$product.orders",
              },
            },
            {
              $unwind: {
                path: "$product.orders.products",
              },
            },
            {
              $match: {
                $expr: { $eq: ["$product.orders.products.product", "$_id"] },
              },
            },
            {
              $group: {
                _id: "$_id",
                name: { $first: "$name" },
                totalOrders: { $sum: "$product.orders.products.quantity" },
              },
            },
            {
              $sort: { totalOrders: -1 },
            },
            {
              $limit: total,
            },
          ],
          as: "product",
        },
      },
      {
        $unwind: {
          path: "$product",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: "$_id",
          name: { $first: "$name" },
          products: {
            $push: {
              name: "$product.name",
              _id: "$product._id",
              total: "$product.totalOrders",
            },
          },
          totalOrders: { $sum: "$product.totalOrders" },
        },
      },
    ]);
    const response = topProducts.map((productCategory) => {
      return {
        title: productCategory.name,
        labels: productCategory.products
          .map((product) => product.name)
          .filter((a) => a),
        data: productCategory.products
          .map((product) => (product.total / productCategory.totalOrders) * 100)
          .filter((a) => a),
      };
    });
    res.json(response);
  } catch (err) {
    await log(err);
    res.status(500).json(err);
  }
};
