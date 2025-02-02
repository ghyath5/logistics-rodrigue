const Category = require("../models/Category");
const { log } = require("../helpers/Loger");

exports.createCategory = async (req, res) => {
  try {
    const newCategory = new Category(req.body);
    const categoryName = await Category.findOne({ name: req.body.name });
    if (categoryName) {
      return res.status(400).json("A category with this name has been created");
    } else {
      const savedCategory = await newCategory.save();
      res.status(200).json(savedCategory);
    }
  } catch (err) {
    await log(`createCategory error : ${err}`);
    res.status(500).json(err);
  }
};
exports.updateCategory = async (req, res) => {
  try {
    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body,
      },
      { new: true }
    );
    if (updatedCategory) {
      res.status(200).json(updatedCategory);
    } else {
      res.status(404).json("There is no category with this id");
    }
  } catch (err) {
    await log(`updateCategory error : ${err}`);
    res.status(500).json(err);
  }
};
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json("Category could not be found");

    if (category.productCount != 0) {
      return res
        .status(403)
        .json(
          "There are products associated to this category there for cannot be deleted"
        );
    } else {
      await Category.findByIdAndDelete(req.params.id);
      return res.status(200).json("Category deleted successfully...");
    }
  } catch (err) {
    await log(`deleteCategory error : ${err}`);
    res.status(500).json(err);
  }
};
exports.getCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (category) return res.status(200).json(category);
    return res.status(404).json("There is no category with this id");
  } catch (err) {
    await log(`getCategory error : ${err}`);
    res.status(500).json(err);
  }
};
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ _id: -1 });
    const categoryCount = await Category.countDocuments();
    let objectToSend = {
      categoryCount,
      categories,
    };

    if (categories) {
      return res.status(200).json(objectToSend);
    } else {
      return res.status(200).json("No categories found");
    }
  } catch (err) {
    await log(`getAllCategories error : ${err}`);
    res.status(500).json(err);
  }
};
