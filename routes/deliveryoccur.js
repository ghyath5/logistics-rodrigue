// const router = require("express").Router();
// const {
//   createDeliveryOccur,
//   updateDeliveryOccur,
//   deleteDeliveryOccur,
//   getDeliveryOccur,
//   getAllDeliveryOccur,
// } = require("../controllers/deliveryoccur");
// const {
//   validateName,
//   validateMongoId,
//   validate,
// } = require("../middlewares/validators");
// const { verifyTokenAndAdmin } = require("../middlewares/verifyToken");

// router
//   .route("/")
//   .post(verifyTokenAndAdmin, validateName, validate, createDeliveryOccur)
//   .get(verifyTokenAndAdmin, getAllDeliveryOccur);

// router
//   .route("/:id")
//   .put(verifyTokenAndAdmin, validateMongoId, validate, updateDeliveryOccur)
//   .delete(verifyTokenAndAdmin, validateMongoId, validate, deleteDeliveryOccur)
//   .get(validateMongoId, getDeliveryOccur);

// module.exports = router;
