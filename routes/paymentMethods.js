const router = require("express").Router();

const {
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  getPaymentMethod,
  getAllPaymentMethods,
} = require("../controllers/paymentMethod");
const {
  validateMongoId,
  validateName,
  validate,
} = require("../middlewares/validators");
const { verifyTokenAndAdmin } = require("../middlewares/verifyToken");

router
  .route("/")
  .post(verifyTokenAndAdmin, validateName, validate, createPaymentMethod)
  .get(verifyTokenAndAdmin, getAllPaymentMethods);

router
  .route("/:id")
  .put(verifyTokenAndAdmin, validateMongoId, validate, updatePaymentMethod)
  .delete(verifyTokenAndAdmin, validateMongoId, validate, deletePaymentMethod)
  .get(validateMongoId, getPaymentMethod);

module.exports = router;
