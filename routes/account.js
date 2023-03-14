const router = require("express").Router();
const { update, changePassword } = require("../controllers/account");
const { validate } = require("../middlewares/validators");
const { verifyToken } = require("../middlewares/verifyToken");

//=============================

router.route("/").put(verifyToken, validate, update);
router.route("/change-password").put(verifyToken, validate, changePassword);

module.exports = router;
