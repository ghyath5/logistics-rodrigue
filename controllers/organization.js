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
      (customer) => customer.customerId.toString() === head.toString()
    );

    if (!headIsCustomer)
      return res.status(400).json({
        success: false,
        message: "The head must be a customer in this organization",
      });

    const savedOrganization = await newOrganization.save();
    res.status(200).json(savedOrganization);
  } catch (err) {
    console.log("createOrganization err", err);
    await log(err);
    res.status(500).json(err);
  }
};
exports.addCustomerToOrganization = async (req, res) => {
  try {
    console.clear();
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
    let customerToPush = { customer: customerId };
    const organization = await Organization.findByIdAndUpdate(
      req.params.id,
      { $push: { customers: customerToPush } },
      { new: true }
    );
    if (organization) {
      return res.status(200).json({ success: true, organization });
    } else {
      return res.status(404).json({
        success: false,
        message: "no organization was found by this id",
      });
    }
  } catch (err) {
    console.log("addCustomerToOrganization err", err);
  }
};
exports.updateOrganization = async (req, res) => {
  try {
    const { name, head, customers } = req.body;

    const nameExists = await Organization.findOne({
      name,
      _id: { $ne: req.params.id },
    });

    if (nameExists)
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
      (customer) => customer.customerId.toString() === head.toString()
    );

    if (!headIsCustomer)
      return res.status(400).json({
        success: false,
        message: "The head must be a customer in this organization",
      });

    const updatedOrganization = await Organization.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body,
      },
      { new: true }
    );
    if (updatedOrganization) {
      res.status(200).json(updatedOrganization);
    } else {
      res.status(404).json("No organization was found with this id !");
    }
  } catch (err) {
    console.log("updateOrganization err", err);
    await log(err);
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
    console.log("deleteOrganization err", err);
    await log(err);
    res.status(500).json(err);
  }
};
exports.getOrganization = async (req, res) => {
  try {
    const organization = await Organization.findById(req.params.id)
      .populate({
        path: "customers",
        populate: {
          path: "customerId",
        },
      })
      .populate("head")
      .exec();

    if (organization) {
      res.status(200).json(organization);
    } else {
      res.status(404).json("No organization was found with this id !");
    }
  } catch (err) {
    await log(err);
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
    await log(err);
    res.status(500).json(err);
  }
};
