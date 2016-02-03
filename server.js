var express = require('express');
var morgan = require('morgan');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var ejs = require('ejs');
var ejs_mate = require('ejs-mate');

var app = express();

var User = require('./models/user');

//connect mongoose to mongodb
mongoose.connect('mongodb://lukeg:luke@ds051595.mongolab.com:51595/griffith_brew', function(err){
  if (err) {
    console.log(err);
  } else {
    console.log('connected to db')
  }
})

//Middleware
app.use(express.static(__dirname + '/public'));
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true}));
app.engine('ejs', ejs_mate);
app.set('view engine', 'ejs');


//routes
var mainRoutes = require('./routes/main');
var userRoutes = require('./routes/user');
app.use(mainRoutes);
app.use(userRoutes);




//server listen
app.listen(8000, function(err){
  if(err) throw err;
  console.log('Server Running ok')
});