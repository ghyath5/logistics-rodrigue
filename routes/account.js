const router = require("express").Router();
const {
  update,
  getAccount,
  changePassword,
} = require("../controllers/account");
const { validate } = require("../middlewares/validators");
const { verifyToken } = require("../middlewares/verifyToken");

//=============================

router
  .route("/")
  .put(verifyToken, validate, update)
  .get(verifyToken, validate, getAccount);
router.route("/change-password").put(verifyToken, validate, changePassword);

module.exports = router;
