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
let walletApiRouter = require('./routes/api/walletApi.route');
let blockApiRouter = require('./routes/api/blockApi.route');
let transactionApiRouter = require('./routes/api/transactionApi.route');

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
app.use('/api/wallet', walletApiRouter);
app.use('/api/blocks', blockApiRouter);
app.use('/api/transactions', transactionApiRouter);

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

const HTTP_PORT = 3000;
const P2P_PORT = 3001;

blockModel.initP2PServer(process.env.P2P_PORT || P2P_PORT);
blockModel.connectToPeers();

app.listen(process.env.HTTP_PORT || HTTP_PORT, function() {
  console.log(`Http server is running at port ${HTTP_PORT}`);
})

module.exports = app;
