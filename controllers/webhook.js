require("dotenv").config();

const xeroHelper = require("../helpers/Xero");

const crypto = require("crypto");

exports.testWebhook = async (req, res) => {
  try {
    const computedSignature = crypto
      .createHmac("sha256", process.env.XERO_WEBHOOK_KEY)
      .update(req.body.toString())
      .digest("base64");
    const xeroSignature = req.headers["x-xero-signature"];

    if (xeroSignature === computedSignature) {
      console.log("Signature passed! This is from Xero!");
      const body = JSON.parse(req.body.toString());
      for (let event of body.events) {
        if (event.eventCategory === "CONTACT") {
          const contactId = event.resourceId;
          await xeroHelper.synchCustomerFromXero(contactId);
        }
      }

      res.status(200).send();
    } else {
      // If this happens someone who is not Xero is sending you a webhook
      console.log(
        `Got {${computedSignature}} when we were expecting {${xeroSignature}}`
      );
      res.status(401).send();
    }
  } catch (err) {
    console.log(err.message);
    res.status(500).json(err.message);
  }
};
