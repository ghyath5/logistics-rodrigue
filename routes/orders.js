const router = require("express").Router();

const {
  createOrder,
  updateOrder,
  deleteOrder,
  getOrder,
  getAllOrders,
  sendCustomerIdToCreateOrder,
  searchOrderByProductText,
  exportOrdersAsExcelFile,
  getOrdersByDate,
} = require("../controllers/orders");
const {
  validateMongoId,
  validate,
  creatingOrder,
} = require("../middlewares/validators");
const { verifyTokenAndAdmin } = require("../middlewares/verifyToken");

router
  .route("/sendcustomeridfororder/:id")
  .post(verifyTokenAndAdmin, sendCustomerIdToCreateOrder);

router
  .route("/")
  .post(verifyTokenAndAdmin, creatingOrder, validate, createOrder)
  .get(verifyTokenAndAdmin, getAllOrders);

router.route("/getordersbydate").get(verifyTokenAndAdmin, getOrdersByDate);

router.route("/findbytext").post(verifyTokenAndAdmin, searchOrderByProductText);

// router.route("/export").get(exportOrdersAsExcelFile);

router
  .route("/:id")
  .put(verifyTokenAndAdmin, validateMongoId, validate, updateOrder)
  .delete(verifyTokenAndAdmin, validateMongoId, validate, deleteOrder)
  .get(validateMongoId, getOrder);

module.exports = router;
