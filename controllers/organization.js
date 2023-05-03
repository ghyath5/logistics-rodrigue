const Organization = require("../models/Organization");
const Customer = require("../models/Customer");
const { log } = require("../helpers/Loger");

exports.createOrganization = async (req, res) => {
  try {
    const { name, head, customers } = req.body;
    const newOrganization = new Organization(req.body);

    const isNewOrganizationName = await Organization.findOne({ name });

    if (isNewOrganizationName)
      return res.status(400).json({
        success: false,
        message: "This organization name is already in use",
      });

    if (!head)
      return res.status(400).json({
        success: false,
        message: "You must provide a head for this organization",
      });

    const headIsCustomer = customers.find(
      (customer) => customer.toString() === head.toString()
    );

    if (!headIsCustomer)
      return res.status(400).json({
        success: false,
        message: "The head must be a customer in this organization",
      });

    for (let i = 0; i < customers.length; i++) {
      const customer = await Customer.findById(customers[i]);
      if (!customer)
        return res.status(404).json({
          success: false,
          message: `No customer was found by the id of ${customers[i]}`,
        });
      if (customer.organization) {
        return res.status(399).json({
          success: false,
          message: `Customer by the id of ${customers[i]} already has a an organization`,
        });
      }
    }

    const savedOrganization = await newOrganization.save();

    await Customer.updateMany(
      { _id: { $in: customers } },
      { $set: { organization: savedOrganization._id } }
    );

    res.status(200).json(savedOrganization);
  } catch (err) {
    await log(`createOrganization error : ${err}`);
    res.status(500).json(err);
  }
};
exports.addCustomerToOrganization = async (req, res) => {
  try {
    const { customerId } = req.body;
    const customer = await Customer.findById(customerId);
    if (!customer)
      return res.status(404).json({
        success: false,
        message: `No customer was found by the id of ${customerId}`,
      });
    if (customer.organization) {
      return res.status(399).json({
        success: false,
        message: `Customer by the id of ${customerId} already has a an organization`,
      });
    }
    const organization = await Organization.findByIdAndUpdate(
      req.params.id,
      { $push: { customers: customerId } },
      { new: true }
    );
    if (organization) {
      await Customer.findByIdAndUpdate(customerId, {
        $set: { organization: organization._id },
      });
      return res.status(200).json({ success: true, organization });
    } else {
      return res.status(404).json({
        success: false,
        message: "no organization was found by this id",
      });
    }
  } catch (err) {
    await log(`addCustomerToOrganization error : ${err}`);
    res.status(500).json(err);
  }
};
exports.updateOrganization = async (req, res) => {
  try {
    const { name, head, customers } = req.body;
    const oldOrg = await Organization.findOne({
      name,
      _id: { $ne: req.params.id },
    }).lean();
    if (oldOrg)
      return res.status(400).json({
        success: false,
        message: "This organization name is already in use",
      });

    if (!head)
      return res.status(400).json({
        success: false,
        message: "You must provide a head for this organization",
      });

    const headIsCustomer = customers.find(
      (customer) => customer.toString() === head.toString()
    );

    if (!headIsCustomer)
      return res.status(400).json({
        success: false,
        message: "The head must be a customer in this organization",
      });

    for (let i = 0; i < customers.length; i++) {
      const customer = await Customer.findOne({
        _id: customers[i],
        organization: { $ne: req.params.id },
      });
      console.log("customer", customer);

      if (customer && customer.organization !== null)
        return res.status(399).json({
          success: false,
          message: `Customer by the id of ${customers[i]} already has an organization`,
        });
    }

    const updatedOrganization = await Organization.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body,
      },
      { new: true }
    );
    if (updatedOrganization) {
      await Customer.updateMany(
        { _id: { $in: customers } },
        { $set: { organization: updatedOrganization._id } }
      );

      const deletedCustomers = oldOrg?.customers?.filter(
        (customer) => !customers.includes(customer.toString())
      );

      await Customer.updateMany(
        { _id: { $in: deletedCustomers } },
        { $set: { organization: null } }
      );

      res.status(200).json(updatedOrganization);
    } else {
      res.status(404).json("No organization was found with this id !");
    }
  } catch (err) {
    await log(`updateOrganization error : ${err}`);
    res.status(500).json(err);
  }
};
exports.deleteOrganization = async (req, res) => {
  try {
    const organization = await Organization.findById(req.params.id);
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "NO organization found by this id",
      });
    }
    if (organization.customers.length) {
      return res.status(403).json({
        success: false,
        message:
          "Organization already has customers in it, remove them if you want to delete it",
      });
    }

    await Organization.findByIdAndDelete(req.params.id);
    res.status(200).json("Organization has been deleted...");
  } catch (err) {
    await log(`deleteOrganization error : ${err}`);
    res.status(500).json(err);
  }
};
exports.getOrganization = async (req, res) => {
  try {
    const organization = await Organization.findById(req.params.id)
      .populate({
        path: "customers",
      })
      .populate("head")
      .exec();

    if (organization) {
      res.status(200).json(organization);
    } else {
      res.status(404).json("No organization was found with this id !");
    }
  } catch (err) {
    await log(`getOrganization error : ${err}`);
    res.status(500).json(err);
  }
};
exports.getAllOrganizations = async (req, res) => {
  try {
    const organizations = await Organization.find()
      .sort({ _id: -1 })
      .populate("customers head");
    const organizationCount = await Organization.countDocuments();
    let objectTosend = {
      organizationCount,
      organizations,
    };
    if (organizations) {
      res.status(200).json(objectTosend);
    } else {
      return res.status(200).json("No organizations found");
    }
  } catch (err) {
    await log(`getAllOrganizations error : ${err}`);
    res.status(500).json(err);
  }
};
