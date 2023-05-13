const { XeroClient } = require("xero-node");

const Customer = require("../models/Customer");
const Sharedrecords = require("../models/Sharedrecords");
const Product = require("../models/Products");
const Order = require("../models/Orders");
const Organization = require("../models/Organization");
const Route = require("../models/Route");

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

    // console.log("Xero Contact created successfully");
  } else {
    await xero.accountingApi.updateContact(
      "",
      contacts.body.contacts[0].contactID,
      {
        contacts: [addUpdateFields],
      }
    );
    //  console.log("Xero Contact updated successfully");
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
      process.env.SHARED_RECORDS_ID
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

// for when the server is first started
const synchAllCustomersFromXero = async () => {
  await xero.getClientCredentialsToken();
  const contacts = await xero.accountingApi.getContacts("");
  const contactList = contacts.body.contacts;

  for (let i = 0; i < contactList.length; i++) {
    await synchCustomerFromXero(contactList[i].contactID);
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
    // console.log("Product updated successfully");
  } else {
    // create product
    const codeSequence = await Sharedrecords.findById(
      process.env.SHARED_RECORDS_ID
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

const synchAllProductsFromXero = async () => {
  await xero.getClientCredentialsToken();

  const items = await xero.accountingApi.getItems("");
  const itemList = items.body.items;

  for (let i = 0; i < itemList.length; i++) {
    await synchProductFromXero(itemList[i].itemID);
  }
};

const synchAllProductsToXero = async () => {
  await xero.getClientCredentialsToken();

  const products = await Product.find({});
  for (let i = 0; i < products.length; i++) {
    await synchProductToXero(products[i]);
  }
};

const synchContactGroupToXero = async (route) => {
  const xeroId = route.xeroid ? route.xeroid : "";
  await xero.getClientCredentialsToken();

  const groups = xeroId
    ? await xero.accountingApi.getContactGroups("", xeroId)
    : { body: { contactGroups: [] } };

  const addUpdateFields = {
    name: route.name,
    status: route.isarchived ? "ARCHIVED" : "ACTIVE",
  };

  if (groups.body.contactGroups.length === 0) {
    // create
    const groups = await xero.accountingApi.createContactGroups(
      "",
      {
        contactGroups: [addUpdateFields],
      },
      summarizeErrors
    );

    // update route xeroid
    await Route.findByIdAndUpdate(route._id, {
      xeroid: groups.body.contactGroups[0].contactGroupID,
    });

    console.log("Xero Contact Group created successfully");
  } else {
    // update
    await xero.accountingApi.updateContactGroup(
      "",
      groups.body.contactGroups[0].contactGroupID,
      {
        contactGroups: [addUpdateFields],
      },
      summarizeErrors
    );
    console.log("Xero Contact Group updated successfully");
  }
};

const synchContactGroupFromXero = async (groupId) => {
  await xero.getClientCredentialsToken();
  const groups = await xero.accountingApi.getContactGroup("", groupId);
  const group = groups.body.contactGroups[0];

  if (!group) return;

  const route = await Route.findOne({
    xeroid: groupId,
  });

  const addUpdateFields = {
    name: group.name,
    isarchived: group.status === "ARCHIVED",
  };

  if (route) {
    // update route
    await route.updateOne(addUpdateFields);
    console.log("Route updated successfully");
  } else {
    // create route
    await Route.create({
      ...addUpdateFields,
      xeroid: groupId,
    });
    console.log("Route created successfully");
  }
};

const synchAllContactGroupsFromXero = async () => {
  await xero.getClientCredentialsToken();

  const groups = await xero.accountingApi.getContactGroups("");
  const groupList = groups.body.contactGroups;

  for (let i = 0; i < groupList.length; i++) {
    await synchContactGroupFromXero(groupList[i].contactGroupID);
  }

  console.log("All Contact Groups synched successfully");
};

const removeContactFromGroupXero = async (contactId, groupId) => {
  await xero.getClientCredentialsToken();

  await xero.accountingApi.deleteContactGroupContact(
    "",
    groupId,
    contactId,
    summarizeErrors
  );

  console.log("Contact removed from group successfully");
};

const removeAllContactsFromGroupXero = async (groupId) => {
  await xero.getClientCredentialsToken();
  await xero.accountingApi.deleteContactGroupContacts(
    "",
    groupId,
    summarizeErrors
  );
  console.log("All Contacts removed from group successfully");
};

const addContactToGroupXero = async (contactId, groupId) => {
  await xero.getClientCredentialsToken();

  await xero.accountingApi.createContactGroupContacts(
    "",
    groupId,
    {
      contacts: [
        {
          contactID: contactId,
        },
      ],
    },
    summarizeErrors
  );

  console.log("Contact added to group successfully");
};

const addContactsToGroupXero = async (xeroIds, groupId) => {
  await xero.getClientCredentialsToken();

  await xero.accountingApi.createContactGroupContacts(
    "",
    groupId,
    {
      contacts: xeroIds.map((xeroId) => ({
        contactID: xeroId,
      })),
    },
    summarizeErrors
  );

  console.log("Contacts added to group successfully");
};

const createInvoice = async (orderId) => {
  const order = await Order.findById(orderId)
    .populate("customer products.product")
    .exec();

  const customer = await Customer.findById(order.customer);
  const xeroId = order.invoiceid ? order.invoiceid : "";

  await xero.getClientCredentialsToken();

  const invoices = xeroId
    ? await xero.accountingApi.getInvoice("", xeroId)
    : { body: { invoices: [] } };

  let head = null;

  if (!customer) {
    throw new Error("Customer not found");
  }

  if (customer.organization) {
    console.log("customer.organization", customer.organization);
    const org = await Organization.findById(customer.organization);
    // console.log("org", org);
    head = org.head.xeroid;
  }

  const addUpdateFields = {
    type: "ACCREC",
    contact: {
      contactID: head ? head : customer.xeroid,
    },
    date: order.date,
    dueDate: order.date,
    lineItems: order.products.map((product) => {
      return {
        description: product.product.name,
        quantity: product.quantity,
        unitAmount: product.pricePerUnit,
        accountCode: "200",
        itemCode: product.product.assignedCode,
        taxType: product.product.taxType,
      };
    }),
    reference: order._id.toString(),
  };

  if (invoices.body.invoices.length === 0) {
    const res = await xero.accountingApi.createInvoices(
      "",
      {
        invoices: [addUpdateFields],
      },
      summarizeErrors
    );

    await Order.findByIdAndUpdate(order._id, {
      invoiceid: res.body.invoices[0].invoiceID,
    });

    console.log("Xero Invoice created successfully");
    return res.body.invoices[0].invoiceID;
  } else {
    const res = await xero.accountingApi.updateInvoice(
      "",
      invoices.body.invoices[0].invoiceID,
      {
        invoices: [addUpdateFields],
      },
      summarizeErrors
    );
    console.log("Xero Invoice updated successfully");
    return res.body.invoices[0].invoiceID;
  }
};

const getInvoiceAsPdf = async (orderId) => {
  await xero.getClientCredentialsToken();

  const order = await Order.findByIdAndUpdate(orderId);

  let invoiceId = order.invoiceid;
  if (!invoiceId) {
    invoiceId = await createInvoice(orderId);
  }

  const res = await xero.accountingApi.getInvoiceAsPdf("", invoiceId, {
    headers: {
      Accept: "application/pdf",
    },
  });
  return res.body;

  // const pdf =  res.body;
  // const base64 = Buffer.from(pdf).toString("base64");
  // return base64;
};

// createInvoice("64004a69d6674efa61fe471a")
//   .then((res) => {
//     console.log(res);
//   })
//   .catch((err) => {
//     console.log(err.response.body.Elements[0].ValidationErrors);
//   });

// getInvoiceAsPdf("c4e53bcf-a2ae-47e2-8e2a-005636057e1d")
//   .then((res) => {
//     const fs = require("fs");
//     const buffer = Buffer.from(res);
//     fs.writeFileSync("invoice.pdf", buffer);
//   })
//   .catch((err) => {
//     console.log(err);
//   });

// synchAllProductsFromXero()
//   .then(() => {
//     console.log("All products synched successfully");
//   })
//   .catch((err) => {
//     console.log(err);
//   });

// synchAllCustomersFromXero()
//   .then(() => {
//     console.log("All products synched successfully");
//   })
//   .catch((err) => {
//     console.log(err);
//   });

// synchAllContactGroupsFromXero().catch((err) => {
//   console.log(err);
// });

// xeroid: 60d578d9-3e10-4aef-b5dc-9d9fd60a3633
// groupid: bc3959ff-c1c9-4b97-b2ee-4a733be61a64

// addContactToGroupXero(
//   "60d578d9-3e10-4aef-b5dc-9d9fd60a3633",
//   "bc3959ff-c1c9-4b97-b2ee-4a733be61a64"
// ).catch((err) => {
//   console.log(JSON.stringify(err.response.body, null, 2));
// });

// addContactsToGroupXero(
//   [
//     "4e2f192e-8397-4d4d-97ca-a4fc5ac531bf",
//     "60d578d9-3e10-4aef-b5dc-9d9fd60a3633",
//   ],
//   "bc3959ff-c1c9-4b97-b2ee-4a733be61a64"
// ).catch((err) => {
//   console.log(JSON.stringify(err.response.body, null, 2));
// });

const resynchContactGroupContactsToXero = async (routeId) => {
  const route = await Route.findById(routeId);
  const contacts = route.customers.map((customer) => customer.xeroid);

  await removeAllContactsFromGroupXero(route.xeroid);
  await addContactsToGroupXero(contacts, route.xeroid);

  console.log("Group Contacts resynched successfully");
};

const resynchContactGroupContactsFromXero = async (groupId) => {
  const route = await Route.findOne({ xeroid: groupId });
  const xeroIds = await getContactsFromGroupXero(groupId).map(
    (contact) => contact.contactID
  );
  const customers = await Customer.find({ xeroid: { $in: xeroIds } });
  await Route.findByIdAndUpdate(route._id, {
    customers: customers.map((customer) => customer._id),
  });
  await Customer.updateMany({ xeroid: { $in: xeroIds } }, { route: route._id });
  console.log("Group Contacts resynched successfully");
};

const getContactsFromGroupXero = async (groupId) => {
  const res = await xero.accountingApi.getContactGroup("", groupId);
  return res.body.contactGroups[0].contacts;
};

removeAllContactsFromGroupXero("bc3959ff-c1c9-4b97-b2ee-4a733be61a64").catch(
  (err) => {
    console.log(JSON.stringify(err.response.body, null, 2));
  }
);

module.exports = {
  createCustomers,
  getCustomer,
  synchCustomerToXero,
  synchCustomerFromXero,
  synchProductToXero,
  synchProductFromXero,
  createInvoice,
  getInvoiceAsPdf,
  synchAllProductsFromXero,
  synchAllCustomersFromXero,
  synchAllProductsToXero,
  synchContactGroupFromXero,
  synchContactGroupToXero,
  synchAllContactGroupsFromXero,
  removeContactFromGroupXero,
  addContactToGroupXero,
};
