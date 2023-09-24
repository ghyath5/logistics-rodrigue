const router = require("express").Router();

const {
  createProduct,
  updateProduct,
  getProduct,
  getproductsPaginated,
  findProductsByTextSearch,
  getTopOrderedProducts,
  getTopProductsByCategory,
} = require("../controllers/products");
const {
  validateMongoId,
  validateCategoryId,
  validate,
} = require("../middlewares/validators");
const { verifyTokenAndAdmin } = require("../middlewares/verifyToken");

router.route("/find").post(verifyTokenAndAdmin, findProductsByTextSearch);
router.route("/get-top").get(verifyTokenAndAdmin, getTopOrderedProducts);
router
  .route("/get-top-by-category")
  .get(verifyTokenAndAdmin, getTopProductsByCategory);

router
  .route("/")
  .post(verifyTokenAndAdmin, validateCategoryId, validate, createProduct)
  .get(getproductsPaginated);

router
  .route("/:id")
  .put(verifyTokenAndAdmin, validateMongoId, validate, updateProduct)
  .get(verifyTokenAndAdmin, validateMongoId, getProduct);
//.delete(verifyTokenAndAdmin, validateMongoId, deleteProduct)

module.exports = router;
