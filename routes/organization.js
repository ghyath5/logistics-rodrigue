const router = require("express").Router();

const {
  createOrganization,
  updateOrganization,
  deleteOrganization,
  getOrganization,
  getAllOrganizations,
  addCustomerToOrganization,
} = require("../controllers/organization");

const { validateMongoId, validate } = require("../middlewares/validators");
const { verifyTokenAndAdmin } = require("../middlewares/verifyToken");

router
  .route("/")
  .post(verifyTokenAndAdmin, createOrganization)
  .get(verifyTokenAndAdmin, getAllOrganizations);

router
  .route("/:id")
  .post(
    verifyTokenAndAdmin,
    validateMongoId,
    validate,
    addCustomerToOrganization
  )
  .delete(verifyTokenAndAdmin, validateMongoId, validate, deleteOrganization)
  .put(verifyTokenAndAdmin, validateMongoId, validate, updateOrganization)
  .get(validateMongoId, getOrganization);

router
  .route("/addcustomer/:id")
  .post(
    verifyTokenAndAdmin,
    validateMongoId,
    validate,
    addCustomerToOrganization
  );

module.exports = router;
