var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
const fs = require('fs-extra');
const {
  render
} = require('jade');
var passport = require('passport');

var db = require('../../database/database.json');

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({
  extended: false
}));

router.post('/profile', function (req, res) {
  var users = db.users;
  var projects = db.projects;
  email = req.body.email.toLowerCase();
  secret = req.body.secret;


  users.map((user) => {
    if (user.email + user.key == email + secret) {
      req.session.user = user;
      req.session.projects = projects;
      req.session.authorised = true;
      if (user.level == 100) {
        req.session.db = db;
      }
    }
  });
  res.redirect('/profile');
});

// redirects
router.get('/login', function (req, res) {
  req.session.authorised ? res.redirect('/profile') : res.render('profile', req.session);
});

router.get('/profile', function (req, res) {
  if (req.session.authorised) {
    req.session.projects = db.projects;
    req.session.authorised = true;
    if (req.session.user.level == 100) {
      req.session.db = db;
    }
    res.render('profile', req.session);
  } else {
    res.redirect('/login');
  }
});

router.get('/profile/:key', function (req, res) {
  if (req.params.key == 'logout') {
    req.session.destroy();
    res.redirect('/login');
  }
});

router.get('/profile/delete/:key', function (req, res) {
  db.projects.map((project) => {
    if (req.params.key == project.id) {
      if (project.authors[0] == req.session.user.email || req.session.user.level == 100) {
        project.level = 101;
        project.authorsBefore = project.authors;
        project.authors = [];
      }
    }
  });
  if (req.session.user.level == 100) {
    db.users = db.users.filter(person => person.email != req.params.key);
    // db.projects = db.projects.filter(sproject => sproject.id == req.params.key);
    // ^^^does not work because I don't want to change array length, and we have deleted projects in db for safekeeping
  }

  fs.writeJSONSync('./database/database.json', db); //JSON.stringify(db)
  return res.redirect('/profile');
});

router.get('/profile/finish/:key', function (req, res) {
  db.projects.map((project) => {
    if (req.params.key == project.id) {
      if (project.authors.includes(req.session.user.email) || req.session.user.level == 100) {
        project.finished = true;
      }
    }
  });

  fs.writeJSONSync('./database/database.json', db); //JSON.stringify(db)
  return res.redirect('/profile');
});

router.get('/profile/unfinish/:key', function (req, res) {
  db.projects.map((project) => {
    if (req.params.key == project.id) {
      if (project.authors.includes(req.session.user.email) || req.session.user.level == 100) {
        project.finished = false;
      }
    }
  });

  fs.writeJSONSync('./database/database.json', db); //JSON.stringify(db)
  return res.redirect('/profile');
});

router.post('/profile/project', function (req, res) {
  var pname = req.body.projectname;
  var pdesc = req.body.projectdescription;
  // var plevl = parseInt(req.body.projectminlevel);

  // if (plevl && plevl < 0 || plevl && plevl > 100) {
  //   plevl = 100;
  // }

  // currently this so people can't share projects publicly

  db.projects = [...db.projects, {
    id: db.projects.length,
    authors: [req.session.user.email],
    name: pname,
    description: pdesc,
    level: 100
  }]

  fs.writeJSONSync('./database/database.json', db); //JSON.stringify(db)

  return res.redirect('/profile');
});

router.post('/profile/append/:key', function (req, res) {
  email = req.body.newUserEmail.toLowerCase();
  db.projects.map((project) => {
    if (project.id == parseInt(req.params.key) && !project.authors.includes(req.params.key)) {
      if (project.authors.length > 0) {
        if (project.authors.includes(req.session.user.email) || req.session.user.level == 100) {
          project.authors.push(email);
        }
      }
    }
  });

  db = db;
  fs.writeJSONSync('./database/database.json', db); //JSON.stringify(db)

  return res.redirect('/profile');
});

router.post('/profile/removeUser/:key', function (req, res) {
  email = req.body.removeUserEmail.toLowerCase();
  database = db;
  database.projects.map((project) => {
    if (project.id == parseInt(req.params.key)) {
      if (project.authors.length > 0) {
        if (project.authors[0] == req.session.user.email || req.session.user.level == 100) {
          console.log("hell yeah brother")
          project.authors = project.authors.filter(person => person != email);
        }
      }
    }
  });

  db = database;
  fs.writeJSONSync('./database/database.json', db); //JSON.stringify(db)

  return res.redirect('/profile');
});

router.get('/profile/leaveProject/:key', function (req, res) {
  db.projects.map(project => {
    if (parseInt(req.params.key) == project.id && project.authors.length > 1) {
      if (project.authors.includes(req.session.user.email) && project.authors[0] != req.session.user.email) {
        project.authors = project.authors.filter(person => person != req.session.user.email);
      }
    }
  });
  fs.writeJSONSync('./database/database.json', db); //JSON.stringify(db)
  res.redirect('/profile');
});

router.post('/profile/changeLevel/:key', function (req, res) {
  if (req.session.user.level == 100) {
    try {
      var newLevel = parseInt(req.body.newLevel);
      db.users.map(person => {
        if (person.email == req.params.key) {
          person.level = newLevel;
        }
      })
      fs.writeJSONSync('./database/database.json', db); //JSON.stringify(db)
      return res.redirect('/profile');
    } catch {
      return res.redirect('/profile');
    }
  } else {
    // return res.send(db.users)
    return res.redirect('/profile');
  }

});

module.exports = router;