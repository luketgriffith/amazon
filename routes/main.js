var router = require('express').Router();
var User = require('../models/user');
var Product = require('../models/product');
var Cart = require('../models/cart');
var async = require('async');
var stripe = require('stripe') ('sk_test_4b0RVoKSyrmDeglKZpl1TShg');
var Category = require('../models/category');
// var busboy = require('connect-busboy');
// var path = require('path');
// var fs = require('fs');
// var multer = require('multer');
// var upload = multer({ dest: '../uploads/'})

// router.post('/upload', upload.single('image_upload'),function(req, res, next){
  
    


//   User.findOne( { _id: req.user._id}, function(err, foundUser, next){
//     console.log(foundUser.profile.name);
//     foundUser.image = req.file
//     foundUser.save(function(err, next){
//       if(err) return next(err); 
//       res.send('Success');
//     })
//   })
// });

function paginate(req, res, next) {
  var perPage = 9;
    var page = req.params.page;

    Product
      .find()
      .skip( perPage * page) //skips documents already viewed in DB
      .limit( perPage )
      .populate('category')
      .exec(function(err, products) {
        if(err) return next(err);
        Product.count().exec(function(err, count){
          if(err) return next(err);
          res.render('main/product-main', {
            products: products,
            pages: count / perPage
          });
        });
      });
    }





Product.createMapping(function(err, mapping){
  if(err){
    console.log('error mapping');
    console.log(err);
  } else {
    console.log('mapping created');
    console.log(mapping);
  }
});

var stream = Product.synchronize();
var count = 0;

stream.on('data', function() {
  count++;
});
stream.on('close', function() {
  console.log('indexed' + count + 'documents');
});
stream.on('error', function(err) {
  console.log(err)
});

router.get('/cart', function(req, res, next){
  console.log('user: ', req.user);
  Cart
    .findOne({ owner: req.user._id })
    .populate('items.item')
    .exec(function(err, foundCart){
      console.log(foundCart);
      if(err) return next(err);
      res.render('main/cart', {
        foundCart: foundCart,
        message: req.flash('remove')
      });
    }); 
});

router.get('/my_items', function(req, res, next) {
  Product.find({ user: req.user._id}, function(err, foundItems){

    if (err) return next(err);
    console.log(foundItems);
    res.render('accounts/my_items', { myItems: foundItems})
  });
});




router.post('/products', function(req, res, next){
  
  Category.findOne({ name: req.body.category }, function(err, foundCat){
    console.log("category:", foundCat)
  var product = new Product();
  product.user = req.user._id;
  product.category = foundCat._id;
  product.name = req.body.name;
  product.image = 'http://lorempixel.com/300/300';
  product.price = Number(req.body.price);
  product.save(function(err){
    if(err) return next(err);
    console.log('success');
    res.redirect('/')
    });
  });
});

router.post('/product/:product_id', function(req, res, next){
  Cart.findOne({ owner: req.user.id }, function(err, cart){
    cart.items.push({
      item: req.body.product_id,
      price: parseFloat(req.body.priceValue),
      quantity: parseInt(req.body.quantity)
    });

    cart.total = (cart.total + parseFloat(req.body.priceValue)).toFixed(2);
    cart.save(function(err) {
      if(err) return next(err);
      return res.redirect('/cart');
    });
  });
});

router.post('/payment', function(req, res, next) {
  var stripeToken = req.body.stripeToken;
  var currentCharges = Math.round(req.body.stripeMoney * 100);
  stripe.customers.create({
    source: stripeToken,
  }).then(function(customer) {
    return stripe.charges.create({
      amount: currentCharges,
      currency: 'usd',
      customer: customer.id
    });
  }).then(function(charge) {
    async.waterfall([
      function(callback){
        Cart.findOne({ owner: req.user._id}, function(err, cart) {
          callback(err, cart);
        })
      },
      function(cart, callback){
        User.findOne({ _id: req.user._id}, function(err, user) {
          if (user) {
            for(var i = 0; i < cart.items.length; i++){
              user.history.push({
                item: cart.items[i].item,
                paid: cart.items[i].price
              });
            }

            user.save(function(err, user){
              if(err) return next(err);
              callback(err, user);
            });
          }
        });
      },
      function(user){
        Cart.update({ owner: user._id}, { $set: { items: [], total: 0}}, function(err, updated){
          if (updated) {
            req.flash('remove', 'Your Purchase Is Complete!');
            res.redirect('/profile');
          }
        });
      }
    ]);
  });

});


router.post('/remove', function(req, res, next){
  Cart.findOne({ owner: req.user._id}, function(err, foundCart){
    foundCart.items.pull(String(req.body.item));

    foundCart.total = (foundCart.total - parseFloat(req.body.price)).toFixed(2);
    foundCart.save(function(err, found){
      if(err) return next(err);
      req.flash('remove', 'Successfully Removed');
      res.redirect('/cart');
    });
  });
});


router.post('/search', function(req, res, next){
  res.redirect('/search?q='+ req.body.q);
});

router.get('/search', function(req, res, next){
  if(req.query.q){
    Product.search({
      query_string: { query: req.query.q }
    }, function(err, results) {
      if(err) return next(err);
      var data = results.hits.hits.map(function(hit) {
        return hit;
      });

      res.render('main/search-result', {
        query: req.query.q,
        data: data
      });

    });
  }
});

router.get('/', function(req, res, next) {
  if(req.user){
    paginate(req, res, next);

  } else{

    res.render('main/home');
  }
});

router.get('/page/:page', function(req, res, next) {
  paginate(req, res, next);
});

router.get('/about', function(req, res){
  res.render('main/about');
});

router.get('/products/:id', function(req, res, next){
  Product 
    .find({ category: req.params.id})
    .populate('category')
    .exec(function(err, products){
      if (err) return next(err);
      res.render('main/category', {
        products: products
      });
    });
});

router.get('/product/:id', function(req, res, next) {
  Product.findById({ _id: req.params.id}, function(err, product) {
    if(err) return next(err);
    res.render('main/product', {
      product: product
    });
  });
});

module.exports = router;