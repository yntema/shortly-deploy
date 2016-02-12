var request = require('request');
var crypto = require('crypto');
var bcrypt = require('bcrypt-nodejs');
var util = require('../lib/utility');

var db = require('../app/config');

var User = db.user;
var Link = db.url;

exports.renderIndex = function(req, res) {
  res.render('index');
};

exports.signupUserForm = function(req, res) {
  res.render('signup');
};

exports.loginUserForm = function(req, res) {
  res.render('login');
};

exports.logoutUser = function(req, res) {
  req.session.destroy(function() {
    res.redirect('/login');
  });
};

exports.fetchLinks = function(req, res) {
  Link.find({}, function(err, links) {
    res.send(200, links);
  });
};

exports.saveLink = function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  Link.findOne({url: uri}, function(err, link){
    if (link){
      res.send(200, link.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title){
        if (err) {
          console.error(err);
          return res.send(404);
        } 
        Link.create({
          url: uri,
          title: title,
          baseUrl: req.headers.origin,
          visits: 0
        }, function(err, linkObj){
          res.send(202, linkObj);
        });
      });
    }
  });
};

exports.loginUser = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  User.findOne({username: username}, function(err, user){
    if (err) {
      res.json(err);
    }
    if (!user) {
      res.redirect('/login');
    } else {
      user.comparePassword(password, function(match){
        if (match) {
          util.createSession(req, res, user);
        } else {
          console.log('redirected, password not found', match);
          res.redirect('/login');
        }
      });
    }
  });
};

exports.signupUser = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  console.log('username, pass', username, password);

  User.findOne({username: username}, function(err, data){
    console.log('data found', data);
    if (err) {
      res.json(err);
    }
    if (!data) {
      var newUser = User.create({
        username: username,
        password: password
      }, function(err, user) {
        if(err) {
          return res.json(err);
        }
        console.log('new users saved', user);
        util.createSession(req, res, user);
      });
    } else {
      console.log('Account already exists');
      res.redirect('/signup');
    }
  });
};

exports.navToLink = function(req, res) {
  Link.findOneAndUpdate({ code: req.params[0] }, { $inc: { visits: 1 }}, 
    function (err, link) {
    if(!link) {
      res.redirect('/');
    } else {
      return res.redirect(link.url);
    }
  });
};
