let createError = require('http-errors');
let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
let logger = require('morgan');
let cors = require('cors');
require('express-async-errors');

let indexRouter = require('./routes/index.route');
let usersRouter = require('./routes/users.route');
let walletRouter = require('./routes/wallet.route');
let explorerRouter = require('./routes/explorer.route');

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

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/wallet', walletRouter);
app.use('/explorer', explorerRouter);

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

const PORT = 3000;

const WebSocket = require('ws');
let p2pPort = process.env.P2P_PORT || 45678;
let wsServer;
if (!wsServer) {
  wsServer = new WebSocket.Server({ port: p2pPort });
  wsServer.on('connection', (client) => {
    console.log("Connected");
    client.send('Hello client')
    client.onmessage = function (message) {
      console.log("Received from socket client: " + message.data);
    }
    client.onclose = function() {
      console.log("Disconnected");
    }
  })
  console.log("Websocket server is running at " + p2pPort);
}

app.listen(3000, function() {
  console.log(`Http server is running at port ${PORT}`);
})

module.exports = app;
