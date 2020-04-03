const Product = require('../models/product');
const formidable = require('formidable');
const _ = require('lodash');
const fs = require('fs');
const { errorHandler } = require('../helpers/dbErrorHandler');

exports.findProductById = (req, res, next, id) => {
  Product.findById(id).exec((err, product) => {
    if (err || !product)
      return res.status(400).json({ error: 'Product not found' });
    // if product found then populate that in the request object
    req.product = product;
    next();
  });
};

exports.read = (req, res) => {
  req.product.photo = undefined;
  // later make a separate request to fetch each product's image. <-- to avoid performance issues.
  return res.json(req.product);
};

exports.create = (req, res) => {
  /**Creating a product will be different than creating a category, here we need to send the formdata because we need to handle the image upload
   * To create a new category, we can access everything we needed from req.body.
   * But we can't do this with product because we will be handling image upload as well.
   * So we need to send the form data from the client side.
   * To handle the form data and the files that comes with it, we need to use a package called 'formidable'
   */
  let form = new formidable.IncomingForm();
  form.keepExtensions = true;
  form.parse(req, (err, fields, files) => {
    if (err)
      return res.status(500).json({ error: 'Image could not be uploaded' });

    //Check for all fields
    const { name, description, price, category, quantity, shipping } = fields;
    if (
      !name ||
      !description ||
      !price ||
      !category ||
      !quantity ||
      shipping === undefined
    )
      return res.status(400).json({ error: 'All fields are required' });

    let product = new Product(fields);
    // This name (files."photo"), the "photo", depends on how you are sending the data from client side, if you're sending with the name of "image" then you need to have (files."image")
    if (files.photo) {
      // 1kb = 1000
      // 1mb = 1000000
      if (files.photo.size > 1000000)
        return res.status(400).json({ error: 'Image should be less than 1MB' });
      product.photo.data = fs.readFileSync(files.photo.path);
      product.photo.contentType = files.photo.type;
    }
    product.save((err, result) => {
      if (err) return res.status(500).json({ error: errorHandler(err) });
      res.json(result);
    });
  });
};

exports.remove = (req, res) => {
  let product = req.product;
  product.remove((err, deletedProduct) => {
    if (err) return res.status(400).json({ error: errorHandler(err) });
    res.json({ message: 'Product deleted successfully' });
  });
};

exports.update = (req, res) => {
  let form = new formidable.IncomingForm();
  form.keepExtensions = true;
  form.parse(req, (err, fields, files) => {
    if (err)
      return res.status(400).json({ error: 'Image could not be uploaded' });
    const { name, description, price, category, quantity, shipping } = fields;
    if (
      !name ||
      !description ||
      !price ||
      !category ||
      !quantity ||
      shipping === undefined
    )
      return res.status(400).json({ error: 'All fields are required' });
    let product = req.product;
    // Once we have the product, replace the existing product details with the new information.
    product = _.extend(product, fields);

    if (files.photo) {
      // 1kb = 1000
      // 1mb = 1000000
      if (files.photo.size > 1000000)
        return res.status(400).json({ error: 'Image should be less than 1MB' });
      product.photo.data = fs.readFileSync(files.photo.path);
      product.photo.contentType = files.photo.type;
    }
    product.save((err, result) => {
      if (err) return res.status(500).json({ error: errorHandler(err) });
      res.json(result);
    });
  });
};
