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
      if (err) return res.status(500).json({ error: err });
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

/**
 * Sell / Arrival
 * Return products by sell = route query parameters = /products?sortBy=sold&order=desc&limit=4, On each request, we return the products based on the whatever we get on the route parameter.
 * Return products by arrival = route query parameters = /products?sortBy=createdAt&order=desc&limit=4, All these query parameters can come from front end client and based on that our method will return the products.
 *if no route params are sent, then all products are returned.
 */

exports.list = (req, res) => {
  let order = req.query.order ? req.query.order : 'asc';
  let sortBy = req.query.sortBy ? req.query.sortBy : '_id';
  let limit = req.query.limit ? parseInt(req.query.limit) : 6;
  Product.find()
    .select('-photo')
    .populate('category')
    .sort([[sortBy, order]])
    .limit(limit)
    .exec((err, products) => {
      if (err) return res.status(400).json({ error: 'Products not found' });
      res.json(products);
    });
};

/**[description]:-
 * It will find the products based on the request product category
 * other products that has the same category, will be returned
 */
exports.listRelated = (req, res) => {
  let limit = req.query.limit ? parseInt(req.query.limit) : 6;
  // Find all other related products excluding itself (given in the route parameter ie. the one with the productId in the route)
  // $ne: <-- not including the one in the route parameter, _id we use just to avoid the current product.
  // basically fetch other products based on the category of the current product.
  Product.find({ _id: { $ne: req.product }, category: req.product.category })
    .limit(limit)
    .populate('category', '_id name')
    .select('-photo')
    .exec((err, products) => {
      if (err) return res.status(400).json({ error: 'Products not found' });
      res.json(products);
    });
};

exports.listCategories = (req, res) => {
  // Lists out all the catogories that are being used by the products (if one category does not contain any products that we are selling then this (listCategories) method will not fetch that categoryId from the database)
  Product.distinct('category', {}, (err, categories) => {
    if (err) return res.status(400).json({ error: 'Categories not found' });
    res.json(categories);
  });
};

/**
 * list products by search (basically filter the products according to the needs)
 * we will implement product search in react frontend
 * we will show categories in checkbox and price range in radio buttons
 * as the user clicks on those checkbox and radio buttons
 * we will make api request and show the products to users based on what he wants
 */
exports.listBySearch = (req, res) => {
  let order = req.body.order ? req.body.order : 'desc';
  let sortBy = req.body.sortBy ? req.body.sortBy : '_id';
  let limit = req.body.limit ? parseInt(req.body.limit) : 100;
  // skip is for "Load More" button on the client page.
  let skip = parseInt(req.body.skip);
  // based on what we get in the req.body, we will populate this (findArgs) object
  let findArgs = {};

  // console.log(order, sortBy, limit, skip, req.body.filters);
  // console.log("findArgs", findArgs);

  for (let key in req.body.filters) {
    if (req.body.filters[key].length > 0) {
      if (key === 'price') {
        // gte -  greater than price [0-10]
        // lte - less than
        findArgs[key] = {
          $gte: req.body.filters[key][0],
          $lte: req.body.filters[key][1],
        };
      } else {
        findArgs[key] = req.body.filters[key];
      }
    }
  }

  Product.find(findArgs)
    .select('-photo')
    .populate('category')
    .sort([[sortBy, order]])
    .skip(skip)
    .limit(limit)
    .exec((err, data) => {
      if (err) return res.status(400).json({ error: 'Products not found' });
      res.json({
        size: data.length,
        data,
      });
    });
};

// This "photo" method will work as a middleware.
// With this we can view any product's photo
exports.photo = (req, res, next) => {
  if (req.product.photo.data) {
    res.set('Content-Type', req.product.photo.contentType);
    return res.send(req.product.photo.data);
  }
  next();
};
