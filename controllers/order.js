const { Order } = require('../models/order');
const { errorHandler } = require('../helpers/dbErrorHandler');
require('dotenv').config();
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.findOrderById = (req, res, next, id) => {
  Order.findById(id)
    .populate('products.product', 'name price')
    .exec((err, order) => {
      if (err || !order)
        return res.status(400).json({ error: errorHandler(err) });
      req.order = order;
      next();
    });
};

exports.create = (req, res) => {
  req.body.order.user = req.profile;
  const order = new Order(req.body.order);
  order.save((error, data) => {
    if (error) return res.status(400).json({ error: errorHandler(error) });
    else {
      // Send email alert to admin
      // order.address
      // order.products.length
      // order.amount
      const emailData = {
        // admin
        to: 'ngopal253@gmail.com',
        from: 'noreply@ecommerce.com',
        subject: `A new order is received`,
        html: `
        <h1>Somebody just made a purchase in your ecommerce store</h1>
        <h2>Customer name: ${order.user.name}</h2>
        <h2>Customer address: ${order.address}</h2>
        <h2>User's purchase history: ${order.user.history.length} purchase</h2>
        <h2>User's email: ${order.user.email}</h2>
        <h2>Total products: ${order.products.length}</h2>
        <h2>Transaction ID: ${order.transaction_id}</h2>
        <h2>Order status: ${order.status}</h2>
        <h2>Product details:</h2>
        <hr/>
        ${order.products
          .map((p) => {
            return `
            <div>
              <h3>Product Name: ${p.name}</h3>
              <h3>Product Price: ${p.price}</h3>
              <h3>Product Quantity: ${p.count}</h3>
            </div>
          `;
          })
          .join('---------------------------')}
        <h2>Total order cost: ${order.amount}</h2>
        <p>Login to your dashboard to see the order in detail.</p> 
        `,
      };
      sgMail
        .send(emailData)
        .then((sent) => console.log('SENT>>>', sent))
        .catch((err) => console.log('ERR>>>', err));

      //email to buyer
      const emailData2 = {
        to: order.user.email,
        from: 'noreply@ecommerce.com',
        subject: `Your order is in process`,
        html: `
          <h1>Hey ${req.profile.name}, Thank you for shopping with us.</h1>
          <h2>Total products: ${order.products.length}</h2>
          <h2>Transaction ID: ${order.transaction_id}</h2>
          <h2>Order status: ${order.status}</h2>
          <h2>Product details:</h2>
          <hr/>
          ${order.products
            .map((p) => {
              return `<div>
              <h3>Product Name: ${p.name}</h3>
              <h3>Product Price: ${p.price}</h3>
              <h3>Product Quantity: ${p.count}</h3>
            </div> `;
            })
            .join('---------------------------')}
          <h2>Total order cost: ${order.amount}</h2>  
          <p>Thank you for shopping with us.</p> 
          `,
      };
      sgMail
        .send(emailData2)
        .then((sent) => console.log('SENT CLIENT>>>', sent))
        .catch((err) => console.log('CLIENT ERR>>>', err));
      res.json(data);
    }
  });
};

exports.listOrders = (req, res) => {
  Order.find()
    .populate('user', '_id name address')
    .sort('-createdAt')
    .exec((err, orders) => {
      if (err) return res.status(400).json({ error: errorHandler(err) });
      res.json(orders);
    });
};

exports.getStatusValues = (req, res) => {
  res.json(Order.schema.path('status').enumValues);
};

exports.updateOrderStatus = (req, res) => {
  Order.update(
    { _id: req.body.orderId },
    { $set: { status: req.body.status } },
    (err, order) => {
      if (err) return res.status(400).json({ error: errorHandler(err) });
      res.json(order);
    }
  );
};
