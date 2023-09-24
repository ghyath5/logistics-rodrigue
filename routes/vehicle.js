const router = require("express").Router();
const {
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getVehicle,
  getAllVehicles,
} = require("../controllers/vehicle");
const {
  verifyTokenAndAdmin,
  verifyTokenAndAuthorization,
} = require("../middlewares/verifyToken");
const { validateMongoId, validate } = require("../middlewares/validators");

router
  .route("/")
  .get(verifyTokenAndAdmin, getAllVehicles)
  .post(verifyTokenAndAdmin, createVehicle);

router
  .route("/:id")
  .get(verifyTokenAndAdmin, getVehicle)
  .put(verifyTokenAndAuthorization, validateMongoId, validate, updateVehicle)
  .delete(verifyTokenAndAdmin, validateMongoId, validate, deleteVehicle);

module.exports = router;
