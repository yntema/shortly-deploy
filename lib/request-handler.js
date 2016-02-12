var request = require('request');
var crypto = require('crypto');
var bcrypt = require('bcrypt-nodejs');
var util = require('../lib/utility');

var db = require('../app/config');

var User = db.user;
var Link = db.url;
// var User = require('../app/models/user');
// var Link = require('../app/models/link');
// var Users = require('../app/collections/users');
// var Links = require('../app/collections/links');

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

// exports.fetchLinks = function(req, res) {
//   Links.reset().fetch().then(function(links) {
//     res.send(200, links.models);
//   });
// };

exports.saveLink = function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }
        var newLink = new Link({
          url: uri,
          title: title,
          baseUrl: req.headers.origin
        });
        newLink.save().then(function(newLink) {
          Links.add(newLink);
          res.send(200, newLink);
        });
      });
    }
  });
};

exports.loginUser = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  console.log('username: ', username);


  User.findOne({username: username}, function(err, user){
    console.log('user from findOne', user);
    if (err) {
      res.json(err);
    }
    if (!user) {
      res.redirect('/login');
    } else {
      user.comparePassword(password, function(match){
        if (match) {
          console.log('passwords match', match);
          // Create session
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
      var newUser = new User({
        username: username,
        password: password
      });
      newUser.save(function(err, user) {
        if (err) console.error(err);
        console.log('new users saved', user);
        util.createSession(req, res, user);
      });
      // TODO: Fix session creation
    } else {
      console.log('Account already exists');
      res.redirect('/signup');
    }
  });


  // new User({ username: username })
  //   .fetch()
  //   .then(function(user) {
  //     if (!user) {
  //       var newUser = new User({
  //         username: username,
  //         password: password
  //       });
  //       newUser.save()
  //         .then(function(newUser) {
  //           Users.add(newUser);
  //           util.createSession(req, res, newUser);
  //         });
  //     } else {
  //       console.log('Account already exists');
  //       res.redirect('/signup');
  //     }
  //   });
};

// exports.navToLink = function(req, res) {
//   new Link({ code: req.params[0] }).fetch().then(function(link) {
//     if (!link) {
//       res.redirect('/');
//     } else {
//       link.set({ visits: link.get('visits') + 1 })
//         .save()
//         .then(function() {
//           return res.redirect(link.get('url'));
//         });
//     }
//   });
// };