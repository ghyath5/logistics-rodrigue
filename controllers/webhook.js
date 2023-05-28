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
        console.log("event.eventCategory", event.eventCategory);
        const resourceId = event.resourceId;
        switch (event.eventCategory) {
          case "CONTACT":
            await xeroHelper.synchCustomerFromXero(resourceId);
            break;
          case "ITEM":
            await xeroHelper.synchProductFromXero(resourceId);
            break;
          // case "GROUP":
          //   await xeroHelper.synchContactGroupFromXero(resourceId);
          //   await xeroHelper.resynchContactGroupContactsFromXero(resourceId);
          default:
            break;
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
    await log(`testWebhook error : ${err.message}`);
    res.status(401).send();
  }
};
