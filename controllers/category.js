const Category = require("../models/Category");

exports.createCategory = async (req, res) => {
  const newCategory = new Category(req.body);
  if (req.body.name) {
    try {
      const categoryName = await Category.findOne({ name: req.body.name });
      if (categoryName) {
        return res
          .status(401)
          .json("A category with this name has been created");
      } else {
        const savedCategory = await newCategory.save();
        res.status(200).json(savedCategory);
      }
    } catch (err) {
      res.status(500).json(err);
    }
  } else {
    return res.status(400).json("A category name is required");
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
    res.status(200).json(updatedCategory);
  } catch (err) {
    res.status(500).json(err);
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.status(200).json("Category has been deleted...");
  } catch (err) {
    res.status(500).json(err);
  }
};

exports.getCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    res.status(200).json(category);
  } catch (err) {
    res.status(500).json(err);
  }
};

exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    if (categories) {
      res.status(200).json(categories);
    } else {
      return res.status(200).json("No categories found");
    }
  } catch (err) {
    res.status(500).json(err);
  }
};
