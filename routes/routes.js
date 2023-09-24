const router = require("express").Router();

const {
  createRoute,
  updateRoute,
  deleteRoute,
  getRouteRoute,
  getAllRoutes,
} = require("../controllers/routes");
const {
  validateMongoId,
  validate,
  creatingRoute,
} = require("../middlewares/validators");
const { verifyTokenAndAdmin } = require("../middlewares/verifyToken");

router
  .route("/")
  .post(verifyTokenAndAdmin, creatingRoute, validate, createRoute)
  .get(getAllRoutes);

router
  .route("/:id")
  .put(verifyTokenAndAdmin, validateMongoId, validate, updateRoute)
  .delete(verifyTokenAndAdmin, validateMongoId, deleteRoute)
  .get(verifyTokenAndAdmin, validateMongoId, getRouteRoute);

module.exports = router;
