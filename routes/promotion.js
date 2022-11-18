const router = require("express").Router();

const {
  createpromotion,
  updatePromotion,
  deletePromotion,
  getPromotion,
  getAllPromotions,
} = require("../controllers/promotion");
const {
  validateMongoId,
  validate,
  validateCreatingPromotion,
} = require("../middlewares/validators");
const { verifyTokenAndAdmin } = require("../middlewares/verifyToken");

router
  .route("/")
  .post(
    verifyTokenAndAdmin,
    validateCreatingPromotion,
    validate,
    createpromotion
  )
  .get(verifyTokenAndAdmin, getAllPromotions);

router
  .route("/:id")
  .put(verifyTokenAndAdmin, validateMongoId, validate, updatePromotion)
  .delete(verifyTokenAndAdmin, validateMongoId, deletePromotion)
  .get(verifyTokenAndAdmin, validateMongoId, getPromotion);

module.exports = router;
//=====================================
