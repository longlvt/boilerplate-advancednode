'use strict';
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const routes = require('./routes.js');
const auth = require('./auth.js');

const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
fccTesting(app); //For FCC testing purposes
app.set('view engine', 'pug');
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false }
}));

myDB(async (client) => {
  const myDataBase = await client.db('database').collection('users');
  routes(app, myDataBase);
  auth(app, myDataBase);

  let currentUsers = 0;
  io.on('connection', socket => {
    console.log('A user has connected');
    ++currentUsers;
    io.emit('user count', currentUsers);
  });

}).catch((e) => {
  app.route('/').get((req, res) => {
    res.render(process.cwd() + '/views/pug/index', 
    { title: e, message: 'Unable to login' });
  });
});

const PORT = process.env.PORT || 3000;

http.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
