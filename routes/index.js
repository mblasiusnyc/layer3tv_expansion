var express = require('express');
var router = express.Router();

var session = require('express-session');
var pass = require('pwd');
var hash = pass.hash;
var swig = require('swig');
var User = require('./../models').User;
var Movie = require('./../models').Movie;

router.get("/", function (req, res) {
    if (req.session.user) res.redirect("/movies");
    else {
      res.redirect("/login");
      res.send(401);
    }
});

router.get('/login', function(req, res) {
  res.render('login');
});

router.get("/signup", function (req, res) {
    if (req.session.user) res.redirect("/");
    else res.render("signup");
});

router.post("/signup", userExist, function (req, res) {
    var password = req.body.password;
    var username = req.body.username;

    hash(password, function (err, salt, hash) {
        if (err) throw err;
        var user = new User({
            username: username,
            salt: salt,
            hash: hash,
        }).save(function (err, newUser) {
            if (err) throw err;
            authenticate(newUser.username, password, function(err, user){
                if(user){
                    req.session.regenerate(function(){
                        req.session.user = user;
                        req.session.success = 'Authenticated as ' + user.username + ' click to <a href="/logout">logout</a>. ' + ' You may now access <a href="/restricted">/restricted</a>.';
                        res.redirect('/');
                    });
                }
            });
        });
    });
});

router.post("/login", function (req, res) {
    authenticate(req.body.username, req.body.password, function (err, user) {
        if (user) {
            req.session.regenerate(function () {
                req.session.user = user;
                req.session.success = 'Authenticated as ' + user.username + ' click to <a href="/logout">logout</a>. ' + ' You may now access <a href="/restricted">/restricted</a>.';
                res.redirect('/');
            });
        } else {
            req.session.error = 'Authentication failed, please check your ' + ' username and password.';
            res.redirect('/login');
        }
    });
});

router.get('/logout', function (req, res) {
    req.session.destroy(function () {
        res.redirect('/');
    });
});


router.get('/signup', function(req, res) {
  res.render('login');
});

router.get('/movies', requiredAuthentication, function(req, res) {
  User.findOne({username: req.session.user.username }, function(err, user){
    res.render('movies', { movies: user.movies });
  })
});

router.post('/movies/add', requiredAuthentication, function(req,res) {
  var movie = new Movie({
    title: req.body.title,
    year: req.body.year,
    rating: req.body.rating
  });

  User.findOne({ username: req.session.user.username }, function(err, user){
    if(err) console.log('err: ',err)
    console.log('user: ',user)
    user.movies.push(movie);
    user.save();
    res.render('movies', { movies: user.movies })
  });
});

//EDIT A MOVIE
router.get('/movies/edit/:_id', requiredAuthentication, function(req, res){
  User.findOne( { username: req.session.user.username }, function(err, user){
    var movie = user.movies.id(req.params._id);
      console.log('editing movie: ', movie)
    res.render('edit', { movie: movie });
  })
});

router.post('/movies/edit/:_id', requiredAuthentication, function(req, res){
  console.log("req.params: ", req.params);
  User.findOne( { username: req.session.user.username }, function(err, user){
    var movie = user.movies.id(req.params._id);
    movie.title = req.body.title;
    movie.year = req.body.year;
    movie.rating = req.body.rating;
    user.save();
    console.log('movie edited: ',movie)
    res.redirect('/movies');
  })
});

//DELETE A MOVIE
router.get('/movies/delete/:_id', requiredAuthentication, function(req, res){
  User.findOne( { username: req.session.user.username }, function(err, user){
    user.movies.id(req.params._id).remove();
    user.save();
    res.redirect('/movies');
  })
});

router.get('/menus', requiredAuthentication, function(req, res) {
  res.render('menus');
});

// Helper Functions

function authenticate(name, pass, fn) {
    if (!module.parent) console.log('authenticating %s:%s', name, pass);
    User.findOne({
        username: name
    },
    function (err, user) {
        if (user) {
            if (err) return fn(new Error('cannot find user'));
            hash(pass, user.salt, function (err, hash) {
                if (err) return fn(err);
                if (hash == user.hash) return fn(null, user);
                fn(new Error('invalid password'));
            });
        } else {
            return fn(new Error('cannot find user'));
        }
    });
}

function requiredAuthentication(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        req.session.error = 'Access denied!';
        res.redirect('/login');
    }
}

function userExist(req, res, next) {
    User.count({
        username: req.body.username
    }, function (err, count) {
        if (count === 0) {
            next();
        } else {
            req.session.error = "User Exist"
            res.redirect("/signup");
        }
    });
} 

module.exports = router;
