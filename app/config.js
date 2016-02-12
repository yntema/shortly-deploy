var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');
var crypto = require('crypto');

mongoose.connect('mongodb://localhost/shortly');

var db = mongoose.connection;

var Schema = mongoose.Schema;


var urlSchema = new Schema({
  url: String,
  baseUrl: String,
  code: String,
  title: String,
  visits: Number,
  date: {type: Date, default: Date.now}
});

var userSchema = new Schema({
  username: String,
  password: String,
  date: {type: Date, default: Date.now}
});



userSchema.methods.comparePassword = function(attemptedPassword, callback) {
  bcrypt.compare(attemptedPassword, this.get('password'), function(err, isMatch) {
    callback(isMatch);
  });
};

userSchema.pre('save', function(next) {
  var cipher = Promise.promisify(bcrypt.hash);
  return cipher(this.password, null, null).bind(this)
    .then(function(hash) {
      this.password = hash;
      next();
    });
});


urlSchema.pre('save', function(next) {
  var shasum = crypto.createHash('sha1');
  shasum.update(this.url);
  this.code = shasum.digest('hex').slice(0, 5);
  next();
});


var urlTable = mongoose.model('Url', urlSchema);
var userTable = mongoose.model('User', userSchema);
module.exports.url = urlTable;
module.exports.user = userTable;
