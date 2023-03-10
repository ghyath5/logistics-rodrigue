const router = require("express").Router();
const { testWebhook } = require("../controllers/webhook");

router.post("/", testWebhook);

module.exports = router;
