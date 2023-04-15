const { XeroClient } = require("xero-node");

const Customer = require("../models/Customer");
const Sharedrecords = require("../models/Sharedrecords");
const Product = require("../models/Products");

require("dotenv").config();

const xeroConfig = {
  clientId: process.env.XERO_CLIENT_ID,
  clientSecret: process.env.XERO_CLIENT_SECRET,
  grantType: "client_credentials",
};

const summarizeErrors = true;

const xero = new XeroClient(xeroConfig);

// STREET: Delivery address
// PBOX: Postal address / Billing address

// create customer - test
const createCustomers = async () => {
  await xero.getClientCredentialsToken();
  await xero.accountingApi.createContacts("", {
    contacts: [
      {
        name: "Test Customers",
        firstName: "Test",
        lastName: "Customer",
        companyNumber: "123456789",
        emailAddress: "emileib.lb@gmail.com",
      },
    ],
  });
};

const getCustomer = async (contactId) => {
  await xero.getClientCredentialsToken();
  const contacts = await xero.accountingApi.getContact("", contactId);
  console.log(contacts.body);
};

const synchCustomerToXero = async (customer) => {
  const xeroId = customer.xeroid ? customer.xeroid : "";

  await xero.getClientCredentialsToken();
  const contacts = xeroId
    ? await xero.accountingApi.getContact("", xeroId)
    : { body: { contacts: [] } };

  const addUpdateFields = {
    name: customer.businessname,
    firstName: customer.firstname,
    lastName: customer.lastname,
    companyNumber: customer.phonenumber,
    emailAddress: customer.email,
    addresses: [
      {
        addressType: "STREET",
        addressLine1: customer.address,
        city: customer.city,
        postalCode: customer.postcode,
        region: customer.region,
        country: "AU",
      },
    ],
    accountNumber: customer.abn,
    contactStatus: customer.isarchived ? "ARCHIVED" : "ACTIVE",
  };
  console.log(contacts.body.contacts);
  if (contacts.body.contacts.length === 0) {
    const contacts = await xero.accountingApi.createContacts(
      "",
      {
        contacts: [addUpdateFields],
      },
      summarizeErrors
    );

    await Customer.findByIdAndUpdate(customer._id, {
      xeroid: contacts.body.contacts[0].contactID,
    });

    console.log("Xero Contact created successfully");
  } else {
    await xero.accountingApi.updateContact(
      "",
      contacts.body.contacts[0].contactID,
      {
        contacts: [addUpdateFields],
      }
    );
    console.log("Xero Contact updated successfully");
  }
};

const synchCustomerFromXero = async (contactId) => {
  await xero.getClientCredentialsToken();
  const contacts = await xero.accountingApi.getContact("", contactId);
  const contact = contacts.body.contacts[0];

  if (!contact) return;

  const customer = await Customer.findOne({
    xeroid: contactId,
  });

  const addUpdateFields = {
    businessname: contact.name,
    firstname: contact.firstName,
    lastname: contact.lastName,
    phonenumber: contact.companyNumber,
    email: contact.emailAddress,
    address:
      contact.addresses.length > 0 ? contact.addresses[0].addressLine1 : "",
    city: contact.addresses.length > 0 ? contact.addresses[0].city : "",
    postcode:
      contact.addresses.length > 0 ? contact.addresses[0].postalCode : "",
    region: contact.addresses.length > 0 ? contact.addresses[0].region : "",
    abn: contact.accountNumber,
    isarchived: contact.contactStatus === "ARCHIVED",
  };

  if (customer) {
    await customer.updateOne(addUpdateFields);
    console.log("Customer updated successfully");
  } else {
    const codeSequence = await Sharedrecords.findById(
      "63663fa59b531a420083d78f"
    );
    let codeid = codeSequence.customercodeid;
    codeid = codeid.toString();

    while (codeid.length < 4) {
      codeid = "0" + codeid;
    }
    await Customer.create({
      ...addUpdateFields,
      codeid: codeid,
      xeroid: contactId,
    });
    codeSequence.customercodeid = codeSequence.customercodeid + 1;
    await codeSequence.save();
    console.log("Customer created successfully");
  }
};

const synchProductToXero = async (product) => {
  const xeroId = product.xeroid ? product.xeroid : "";

  await xero.getClientCredentialsToken();
  const items = xeroId
    ? await xero.accountingApi.getItem("", xeroId)
    : { body: { items: [] } };

  const addUpdateFields = {
    code: product.assignedCode,
    name: product.name,
    description: product.description,
    salesDetails: {
      unitPrice: product.price,
      taxType: product.taxType,
    },
    // no need for purchase details
    status: product.isarchived ? "ARCHIVED" : "ACTIVE",
  };

  if (items.body.items.length === 0) {
    // create
    const items = await xero.accountingApi.createItems(
      "",
      {
        items: [addUpdateFields],
      },
      summarizeErrors
    );

    // update product xeroid
    await Product.findByIdAndUpdate(product._id, {
      xeroid: items.body.items[0].itemID,
    });

    console.log("Xero Item created successfully");
  } else {
    // update
    await xero.accountingApi.updateItem(
      "",
      items.body.items[0].itemID,
      {
        items: [addUpdateFields],
      },
      summarizeErrors
    );

    console.log("Xero Item updated successfully");
  }
};

const synchProductFromXero = async (productId) => {
  await xero.getClientCredentialsToken();
  const items = await xero.accountingApi.getItem("", productId);
  const item = items.body.items[0];

  if (!item) return;

  const product = await Product.findOne({
    xeroid: productId,
  });

  const addUpdateFields = {
    assignedCode: item.code,
    name: item.name,
    description: item.description,
    price: item.salesDetails.unitPrice,
    taxType: item.salesDetails.taxType,
    isarchived: item.status === "ARCHIVED",
  };

  if (product) {
    // update product
    await product.updateOne(addUpdateFields);
    console.log("Product updated successfully");
  } else {
    // create product
    const codeSequence = await Sharedrecords.findById(
      "63663fa59b531a420083d78f"
    );
    let codeid = codeSequence.productcodeid;
    codeid = codeid.toString();
    while (codeid.length < 4) {
      codeid = "0" + codeid;
    }
    addUpdateFields.generatedCode = codeid;
    await Product.create({
      ...addUpdateFields,
      xeroid: productId,
    });
    codeSequence.productcodeid = codeSequence.productcodeid + 1;
    await codeSequence.save();
    console.log("Product created successfully");
  }
};

module.exports = {
  createCustomers,
  getCustomer,
  synchCustomerToXero,
  synchCustomerFromXero,
  synchProductToXero,
  synchProductFromXero,
};
