const express = require('express');
const session = require('express-session');
const routes = require('./routes/routes');
const fs = require('fs-extra');

var app = express();

app.set('trust proxy', 1) // trust first proxy
app.use(session({
  secret: 'sebmandal.com=your_mom',
  resave: false,
  saveUninitialized: true,
  // cookie: {
  //   secure: true
  // }
  // ^^^if https, not http
}));

const path = require('path');
const port = process.env.PORT || 3000;

app.set('views', path.join(__dirname, 'views/pages'));
app.set('view engine', 'pug');

app.use(express.static(path.join(__dirname, 'public')));
app.use(routes);

app.listen(port);