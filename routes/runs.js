const router = require("express").Router();
const {
  createRun,
  updateRun,
  deleteRun,
  getRun,
  getAllRuns,
  getRunPdf,
  findRunByDriverIdOrDate,
} = require("../controllers/runs");
const { validateMongoId, validate } = require("../middlewares/validators");
const { verifyTokenAndAdmin } = require("../middlewares/verifyToken");

//==============================

router.route("/").post(verifyTokenAndAdmin, createRun).get(getAllRuns);

router
  .route("/:id")
  .delete(verifyTokenAndAdmin, validateMongoId, validate, deleteRun)
  .put(verifyTokenAndAdmin, validateMongoId, validate, updateRun)
  .get(validateMongoId, getRun);

router.route("/:id/pdf").get(validateMongoId, getRunPdf);

router.route("/findrun").post(findRunByDriverIdOrDate);

module.exports = router;
