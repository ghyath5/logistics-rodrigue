const router = require("express").Router();
const {
  getUser,
  updateUser,
  deteleUser,
  findUsersByTextSearch,
} = require("../controllers/users");
const { validateMongoId, validate } = require("../middlewares/validators");
const { verifyUpperAdmin, verifyToken } = require("../middlewares/verifyToken");

//=============================

router
  .route("/:id")
  .get(verifyToken, verifyUpperAdmin, getUser)
  .put(verifyToken, verifyUpperAdmin, validateMongoId, validate, updateUser)
  .delete(verifyToken, verifyUpperAdmin, validateMongoId, validate, deteleUser);

router.route("/find").post(verifyUpperAdmin, findUsersByTextSearch);

module.exports = router;
