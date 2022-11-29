const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const sessionInstance = require('./app-config/session');
const protect = require('./app-config/protect');

if (process.env.NODE_ENV === 'development') {
	require('dotenv').config();
}

const indexRouter = require('./routes/pages/index');
const usersRouter = require('./routes/pages/users');
const testsRouter = require('./routes/pages/tests');
const authRouter = require('./routes/pages/auth');
const lobbyRouter = require('./routes/pages/lobby');
const chatRouter = require('./routes/api/chat');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(sessionInstance);

// public
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/tests', testsRouter);
app.use('/auth', authRouter);

// protected
app.use('/lobby', protect, lobbyRouter);
app.use('/chat', protect, chatRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => {
	next(createError(404));
});

// error handler
app.use((err, req, res, next) => {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.render('error');
});

module.exports = app;
