const Promotion = require("../models/Promotion");
const Customer = require("../models/Customer");
const { log } = require("../helpers/Loger");
const Products = require("../models/Products");
const Category = require("../models/Category");

exports.createPromotion = async (req, res) => {
  const { productspromotion, categorypromotion, from, to } = req.body;
  try {
    let now = new Date();
    let fromDate = new Date(from);
    let toDate = new Date(to);

    if (toDate < now || fromDate < now) {
      return res.status(400).json({
        success: false,
        message: "Please enter dates in the future",
      });
    }

    if (toDate < fromDate) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid date range",
      });
    }

    const newPromotion = new Promotion(req.body);
    console.log("newPromotion", newPromotion);
    let isProductPromotion = productspromotion.length != 0;
    let isCategoryPromotion = Object.keys(categorypromotion).length != 0;

    let isValidPromotion = isProductPromotion != isCategoryPromotion;

    if (!isValidPromotion) {
      return res.status(400).json({
        success: false,
        message: "Please fill in with only one type of promotion",
      });
    }

    if (isProductPromotion) {
      for (let i = 0; i < productspromotion.length; i++) {
        const product = await Products.findById(productspromotion[i].productId);

        if (!product) {
          return res.status(404).json({
            success: false,
            message: "Could not find product by this id",
          });
        }

        let originalproductprice = product.price;

        if (originalproductprice <= productspromotion[i].newprice)
          return res.status(400).json({
            success: false,
            message:
              "Please enter a lower price than the ususal one to create a promotion",
          });
      }
    } else {
      const category = await Category.findById(categorypromotion.categoryId);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Could not find category by this id",
        });
      }
    }

    const savedPromotion = await newPromotion.save();
    return res.status(200).json({ success: true, data: savedPromotion });
  } catch (err) {
    await log(`createPromotion error : ${err}`);
    res.status(500).json(err);
  }
};
exports.updatePromotion = async (req, res) => {
  const { productspromotion, categorypromotion, from, to } = req.body;

  try {
    const promotionToUpdate = await Promotion.findById(req.params.id);
    if (!promotionToUpdate) {
      return res.status(404).json("No promotion was found with this id !");
    }

    let now = new Date();
    let fromDate = new Date(from);
    let toDate = new Date(to);

    if (fromDate < now || toDate < now) {
      return res.status(400).json({
        success: false,
        message: "Please enter dates in the future",
      });
    }

    let isProductPromotion = productspromotion.length != 0;
    let isCategoryPromotion = Object.keys(categorypromotion).length != 0;

    let isValidPromotion = isProductPromotion != isCategoryPromotion;

    if (!isValidPromotion) {
      return res.status(400).json({
        success: false,
        message: "Please fill in with only one type of promotion",
      });
    }

    if (isProductPromotion) {
      for (let i = 0; i < productspromotion.length; i++) {
        const product = await Products.findById(productspromotion[i].productId);

        if (!product) {
          return res.status(404).json({
            success: false,
            message: "Could not find product by this id",
          });
        }

        let originalproductprice = product.price;

        if (originalproductprice <= productspromotion[i].newprice)
          return res.status(400).json({
            success: false,
            message:
              "Please enter a lower price than the ususal one to create a promotion",
          });
      }
    } else {
      const category = await Category.findById(categorypromotion.categoryId);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Could not find category by this id",
        });
      }
    }
    const updatedPromotion = await Promotion.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body,
      },
      { new: true }
    );
    if (updatedPromotion) {
      return res.status(200).json(updatedPromotion);
    } else {
      return res.status(404).json("No promotion was found with this id !");
    }
  } catch (err) {
    await log(`updatePromotion error : ${err}`);
    res.status(500).json(err);
  }
};
exports.deletePromotion = async (req, res) => {
  try {
    const customers = await Customer.find({ promotions: req.params.id });
    if (customers) {
      let customersIds = customers.map(function (item) {
        return item["_id"].toString();
      });

      for (let i = 0; i < customersIds.length; i++) {
        await Customer.updateOne(
          { _id: customersIds[i] },
          { $pull: { promotions: req.params.id } }
        );
      }

      await Promotion.findByIdAndDelete(req.params.id);
      res.status(200).json("Promotion has been deleted...");
    } else {
      await Promotion.findByIdAndDelete(req.params.id);
      res.status(200).json("Promotion has been deleted...");
    }
  } catch (err) {
    await log(`deletePromotion error : ${err}`);
    res.status(500).json(err);
  }
};
exports.getPromotion = async (req, res) => {
  try {
    const promotion = await Promotion.findById(req.params.id)
      .populate({
        path: "productspromotion",
        populate: {
          path: "productId",
        },
      })
      .populate({
        path: "categorypromotion",
        populate: {
          path: "categoryId",
        },
      })
      .exec();

    if (promotion) {
      res.status(200).json(promotion);
    } else {
      res.status(404).json("No promotion was found with this id !");
    }
  } catch (err) {
    await log(`deletePromotion error : ${err}`);
    res.status(500).json(err);
  }
};
exports.getAllPromotions = async (req, res) => {
  try {
    const promotions = await Promotion.find()
      .sort({ _id: -1 })
      .populate({
        path: "productspromotion",
        populate: {
          path: "productId",
        },
      })
      .populate({
        path: "categorypromotion",
        populate: {
          path: "categoryId",
        },
      })
      .exec();
    const promotionCount = await Promotion.countDocuments();

    let objectTosend = {
      promotionCount,
      promotions,
    };

    if (promotions) {
      res.status(200).json(objectTosend);
    } else {
      return res.status(200).json("No categories found");
    }
  } catch (err) {
    await log(`getAllPromotions error : ${err}`);
    res.status(500).json(err);
  }
};
