const router = require("express").Router();

const {
  createCategory,
  updateCategory,
  deleteCategory,
  getCategory,
  getAllCategories,
} = require("../controllers/category");
const {
  validateName,
  validateMongoId,
  validate,
} = require("../middlewares/validators");
const { verifyTokenAndAdmin } = require("../middlewares/verifyToken");

router
  .route("/")
  .post(verifyTokenAndAdmin, validateName, validate, createCategory)
  .get(verifyTokenAndAdmin, getAllCategories);

router
  .route("/:id")
  .put(verifyTokenAndAdmin, validateMongoId, validate, updateCategory)
  .delete(verifyTokenAndAdmin, validateMongoId, validate, deleteCategory)
  .get(validateMongoId, validate, getCategory);

module.exports = router;
