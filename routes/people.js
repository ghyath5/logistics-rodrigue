const router = require("express").Router();
const {
  getAllAdmins,
  getAllUsers,
  getAllStaff,
} = require("../controllers/getPeople");
const {
  verifyUpperAdmin,
} = require("../middlewares/verifyToken");

router.route("/admins").get(verifyUpperAdmin, getAllAdmins);
router.route("/users").get(verifyUpperAdmin, getAllUsers);
router.route("/staffmembers").get(verifyUpperAdmin, getAllStaff);

module.exports = router;
