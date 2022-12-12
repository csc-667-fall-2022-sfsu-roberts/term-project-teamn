const session = require('express-session');

const sessionInstance = session({
	store: new (require('connect-pg-simple')(session))({
		// Insert connect-pg-simple options here
		pgPromise: require('../db'),
		createTableIfMissing: true,
	}),
	secret: 'qwertyuioasdfghjkzxcvb',
	cookie: { maxAge: 24 * 60 * 60 * 1000 },
	resave: false,
	saveUninitialized: true,
});

module.exports = sessionInstance;
