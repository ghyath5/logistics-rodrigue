const router = require("express").Router();
const {
  createCostumer,
  updateCostumer,
  deleteCostumer,
  getCostumer,
  getCostumerPaginatedArchived,
  findCustomerByTextSearch,
  getTopCustomers,
  getCustomersToCall,
  toggleCall,
  getAllNonOrganizationalCustomers,
} = require("../controllers/costumer");
const {
  validateCreateCustomer,
  validateMongoId,
  validate,
} = require("../middlewares/validators");
const { verifyTokenAndAdmin } = require("../middlewares/verifyToken");

router.route("/find").post(verifyTokenAndAdmin, findCustomerByTextSearch);

router.route("/get-top").get(verifyTokenAndAdmin, getTopCustomers);

router
  .route("/")
  .post(verifyTokenAndAdmin, validateCreateCustomer, validate, createCostumer)
  .get(verifyTokenAndAdmin, getCostumerPaginatedArchived);

router.route("/calls").get(verifyTokenAndAdmin, getCustomersToCall);
router.route("/:id/calls").put(verifyTokenAndAdmin, toggleCall);

router
  .route("/:id")
  .put(verifyTokenAndAdmin, validateMongoId, validate, updateCostumer)
  .delete(verifyTokenAndAdmin, validateMongoId, validate, deleteCostumer)
  .get(validateMongoId, validate, getCostumer);

router.route("/getnonorgacustomers").post(getAllNonOrganizationalCustomers);

module.exports = router;
