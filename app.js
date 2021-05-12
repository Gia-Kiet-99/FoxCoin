let createError = require('http-errors');
let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
let logger = require('morgan');
let cors = require('cors');
const session = require("express-session");
require('express-async-errors');

let indexRouter = require('./routes/index.route');
let usersRouter = require('./routes/users.route');
let walletRouter = require('./routes/wallet.route');
let explorerRouter = require('./routes/explorer.route');
let userApiRouter = require('./routes/api/userApi.route');

let app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ secret: "keyboard cat", resave: true, saveUninitialized: true }));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/wallet', walletRouter);
app.use('/explorer', explorerRouter);
app.use('/api/users', userApiRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


const blockModel = require('./model/blockchain');
blockModel.initP2PServer(45678);

const PORT = 3000;
app.listen(3000, function() {
  console.log(`Http server is running at port ${PORT}`);
})

module.exports = app;
