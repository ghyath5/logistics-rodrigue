const router = require("express").Router();

const {
  createPromotion,
  updatePromotion,
  deletePromotion,
  getPromotion,
  getAllPromotions,
} = require("../controllers/promotion");
const {
  validateMongoId,
  validate,
  creatingPromotion,
} = require("../middlewares/validators");
const { verifyTokenAndAdmin } = require("../middlewares/verifyToken");

router
  .route("/")
  .post(verifyTokenAndAdmin, creatingPromotion, validate, createPromotion)
  .get(verifyTokenAndAdmin, getAllPromotions);

router
  .route("/:id")
  .put(verifyTokenAndAdmin, validateMongoId, validate, updatePromotion)
  .delete(verifyTokenAndAdmin, validateMongoId, deletePromotion)
  .get(verifyTokenAndAdmin, validateMongoId, getPromotion);

module.exports = router;
