const { XeroClient } = require("xero-node");

const Customer = require("../models/Customer");
const Sharedrecords = require("../models/Sharedrecords");

require("dotenv").config();

const xeroConfig = {
  clientId: process.env.XERO_CLIENT_ID,
  clientSecret: process.env.XERO_CLIENT_SECRET,
  grantType: "client_credentials",
};

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
  await xero.getClientCredentialsToken();
  const oldYear = new Date(
    new Date().setFullYear(new Date().getFullYear() - 10)
  );
  const contacts = await xero.accountingApi.getContacts("", oldYear, {
    where: `name=="${customer.businessname}"`,
  });

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

  if (contacts.body.contacts.length === 0) {
    await xero.accountingApi.createContacts("", {
      contacts: [addUpdateFields],
    });
    console.log("Xero Contact updated successfully");
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
    businessname: contact.name,
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
    });
    codeSequence.customercodeid = codeSequence.customercodeid + 1;
    await codeSequence.save();
    console.log("Customer created successfully");
  }
};

module.exports = {
  createCustomers,
  getCustomer,
  synchCustomerToXero,
  synchCustomerFromXero,
};
