const { check, validationResult } = require("express-validator");
const mongoose = require("mongoose");

// AUTH
exports.validateSignup = [
  check("name")
    .trim()
    .not()
    .isEmpty()
    .withMessage("Name is missing")
    .isLength({ min: 3, max: 20 })
    .withMessage("Invalid name, name must be 3 to 20 characaters long"),
  check("username")
    .trim()
    .not()
    .isEmpty()
    .withMessage("Username is missing")
    .isLength({ min: 3, max: 20 })
    .withMessage("Invalid username, name must be 3 to 20 characaters long"),
  check("email").isEmail().withMessage("Email is Invalid"),
  check("password")
    .trim()
    .not()
    .isEmpty()
    .withMessage("Password cannot be empty")
    .isLength({ min: 8, max: 20 })
    .withMessage("Invalid password, password must be 8 to 20 characaters long"),
  check("phonenumber")
    .trim()
    .not()
    .isEmpty()
    .withMessage("Phone Number is missing"),
];
exports.validateLogin = [
  check("username").trim().not().isEmpty().withMessage("Username is missing"),
  check("password")
    .trim()
    .not()
    .isEmpty()
    .withMessage("Password cannot be empty"),
];
// Creating Customer
exports.validateCreateCustomer = [
  check("abn").trim().not().isEmpty().withMessage("Abn field is missing"),
  check("businessname")
    .trim()
    .not()
    .isEmpty()
    .withMessage("Business Name is missing"),
  check("address")
    .trim()
    .not()
    .isEmpty()
    .withMessage("Please provide at least one address"),
  check("suburb").trim().not().isEmpty().withMessage("Suburb Name is missing"),
  check("email")
    .isEmail()
    .withMessage("Email is Invalid")
    .not()
    .isEmpty()
    .withMessage("Email is missing"),
  check("customername")
    .trim()
    .not()
    .isEmpty()
    .withMessage("customer name is required"),
  check("phonenumber")
    .trim()
    .not()
    .isEmpty()
    .withMessage("phonenumber is required"),
  check("deliveryoccur")
    .trim()
    .not()
    .isEmpty()
    .withMessage("Deliveryoccur is required"),
  check("isconsolidatedbiller")
    .trim()
    .not()
    .isEmpty()
    .withMessage("Consolidated biller is required"),
  check("postcode").trim().not().isEmpty().withMessage("Post code is required"),
  check("state").trim().not().isEmpty().withMessage("State is required"),
];
// Creating Promotion
exports.creatingPromotion = [
  check("name").trim().not().isEmpty().withMessage("Promotion Name is missing"),
  check("from")
    .trim()
    .not()
    .isEmpty()
    .withMessage("Promotion starting date is missing"),
  check("to")
    .trim()
    .not()
    .isEmpty()
    .withMessage("Promotion ending date is missing"),
];
// Creating Order
exports.creatingOrder = [
  check("customer")
    .trim()
    .not()
    .isEmpty()
    .withMessage("Customer Id is missing"),
  check("date")
    .trim()
    .not()
    .isEmpty()
    .withMessage("date is missing")
    .isISO8601()
    .toDate()
    .withMessage("date is invalid"),
  check("products")
    .not()
    .isEmpty()
    .withMessage("Please insert at least one product"),
];
// Creating Biller
exports.validateName = [
  check("name").trim().not().isEmpty().withMessage("Name is missing"),
];
exports.validatePhone = [
  check("phone").trim().not().isEmpty().withMessage("Phone number is missing"),
];
// Creating Routes
exports.creatingRoute = [
  check("name").trim().not().isEmpty().withMessage("Route Name is missing"),
  check("description")
    .trim()
    .not()
    .isEmpty()
    .withMessage("Route description is missing"),
  check("places").not().isEmpty().withMessage("Route places are missing"),
  check("from")
    .trim()
    .not()
    .isEmpty()
    .withMessage("From attribute is required"),
  check("to").trim().not().isEmpty().withMessage("To attribute is required"),
];
// Creating RUNS
exports.creatingRun = [
  check("route").trim().not().isEmpty().withMessage("Route Id is missing"),
  check("places")
    .trim()
    .not()
    .isEmpty()
    .withMessage("Route places are missing"),
];
// IDS
exports.validateMongoId = (req, res, next) => {
  const isValid = mongoose.Types.ObjectId.isValid(req.params.id);
  if (!isValid) {
    return res.status(400).json("Please enter a valid ID");
  } else {
    next();
  }
};
exports.validateCategoryId = (req, res, next) => {
  const isValid = mongoose.Types.ObjectId.isValid(req.body.categoryId);
  if (!isValid) {
    return res.status(400).json("Please enter a valid ID");
  } else {
    next();
  }
};
// MAIN
exports.validate = (req, res, next) => {
  const error = validationResult(req).array();
  if (!error.length) return next();

  res.status(400).json({ success: false, error: error[0].msg });
};
