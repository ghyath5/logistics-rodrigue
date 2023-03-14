const router = require("express").Router();
const {
  getUser,
  updateUser,
  deteleUser,
  findUsersByTextSearch,
} = require("../controllers/users");
const { validateMongoId, validate } = require("../middlewares/validators");
const { verifyUpperAdmin } = require("../middlewares/verifyToken");

//=============================

router
  .route("/:id")
  .get(verifyUpperAdmin, getUser)
  .put(verifyUpperAdmin, validateMongoId, validate, updateUser)
  .delete(verifyUpperAdmin, validateMongoId, validate, deteleUser);

router.route("/find").post(verifyUpperAdmin, findUsersByTextSearch);

module.exports = router;
