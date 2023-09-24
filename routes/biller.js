// const router = require("express").Router();
// const {
//   createBiller,
//   updateBiller,
//   deleteBiller,
//   getAllBillers,
//   getBiller,
// } = require("../controllers/biller");
// const {
//   validateName,
//   validateMongoId,
//   validate,
// } = require("../middlewares/validators");
// const { verifyTokenAndAdmin } = require("../middlewares/verifyToken");

// router
//   .route("/")
//   .post(verifyTokenAndAdmin, validateName, validate, createBiller)
//   .get(getAllBillers);

// router
//   .route("/:id")
//   .put(verifyTokenAndAdmin, validateMongoId, validate, updateBiller)
//   .delete(verifyTokenAndAdmin, validateMongoId, validate, deleteBiller)
//   .get(validateMongoId, getBiller);

// module.exports = router;
