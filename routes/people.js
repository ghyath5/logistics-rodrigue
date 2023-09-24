const router = require("express").Router();

const {
  getAllAdmins,
  getAllUsers,
  getAllStaff,
} = require("../controllers/getPeople");
const { verifyUpperAdmin, verifyToken } = require("../middlewares/verifyToken");

router.route("/admins").get(verifyToken, verifyUpperAdmin, getAllAdmins);
router.route("/users").get(verifyToken, verifyUpperAdmin, getAllUsers);
router.route("/staffmembers").get(verifyToken, verifyUpperAdmin, getAllStaff);

module.exports = router;
