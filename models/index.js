var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/layer3tv'); //connects us to mongodb
var db = mongoose.connection;  //defines an object that has properties of our mongodb connection
db.on('error', console.error.bind(console, 'mongodb connection error'));  //defines error response

var Movie, User;
var Schema = mongoose.Schema;

var movieSchema = new Schema({
  title: String,
  year: Number,
  rating: Number
});

var userSchema = new Schema({
  username: String,
  password: String,
  salt: String,
  hash: String,
  movies: [movieSchema]
});

Movie = mongoose.model('Movie', movieSchema);
User = mongoose.model('User', userSchema);

module.exports = {"Movie": Movie, "User": User};