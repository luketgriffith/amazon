var router = require('express').Router();
var User = require('../models/user');
var Cart = require('../models/cart');
var passport = require('passport');
var passportConf = require('../config/passport');
var async = require('async');
var multer = require('multer');
var upload = multer({ dest: '../uploads/'})
var fs = require('fs');
var path = require('path');



router.get('/signup', function(req, res, next){
  res.render('accounts/signup', {
    errors: req.flash('errors')
  });
});

router.get('/login', function(req, res){
  if (req.user) return res.redirect('/');
  res.render('accounts/login', {message: req.flash('loginMessage')})
})

router.post('/login', passport.authenticate('local-login', {
  successRedirect: '/profile',
  failureRedirect: '/login',
  failureFlash: true
})); 

router.get('/profile', passportConf.isAuthenticated, function(req, res){
  User
    .findOne({ _id: req.user._id})
    .populate('history.item')
    .exec(function(err, foundUser) {
      if(err) return next(err);

      res.render('accounts/profile', {user: foundUser})
    })
});
    
router.get('/add_item', passportConf.isAuthenticated, function(req, res){
  res.render('accounts/add_item')
});



var now = new Date();

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/')
    },
    filename: function (req, file, cb) {
      console.log('that req of yours: ', req);
        cb(null, file.fieldname + '-' + now + path.extname(file.originalname))
  }
})
var upload = multer({ storage: storage});

router.post('/signup', upload.single('image_upload'), function(req, res, next){
  console.log(storage);
  async.waterfall([
    function(callback){
       var user = new User();

        user.profile.name = req.body.username;
        user.password = req.body.password;
        user.email = req.body.email;
        user.profile.picture = user.gravatar();
        user.image = 'image_upload' + now +'.jpeg';
        User.findOne({ email: req.body.email}, function(err, existingUser){
          if (existingUser){
            req.flash('errors', 'Account already exists');
            return res.redirect('/signup');
          } else {
            user.save(function(err, user) {
              if(err) return next(err);
              callback(null, user);
            });
          }
        });
      },
        
    function(user){
      var cart= new Cart();
      cart.owner = user._id;
      cart.save(function(err){
        if(err) return next(err);
        req.logIn(user, function(err){
          if(err) return next(err);
          res.redirect('/profile');
        })
      })
    }
  ])
});

    

router.get('/logout', function(req, res, next){
  console.log('logging out')
  req.logout();
  res.redirect('/');
  next();
})
router.get('/edit-profile', function(req, res){
  res.render('accounts/edit-profile', {message: req.flash('success')})
});
router.post('/edit-profile', function(req, res, next){
  User.findOne({_id: req.user._id}, function(err, user){
    if(err) return next(err);
    if(req.body.name) user.profile.name = req.body.name;
    if(req.body.address) user.address = req.body.address;

    user.save(function(err){
      if(err) return next(err);
      req.flash('success', 'profile edited');
      return res.redirect('/edit-profile');
    });
  });
});

router.get('/auth/facebook', passport.authenticate('facebook', {scope: 'email'}));

router.get('/auth/facebook/callback', passport.authenticate('facebook', {
  successRedirect: '/profile',
  failureRedirect: '/login'
}));


module.exports = router;