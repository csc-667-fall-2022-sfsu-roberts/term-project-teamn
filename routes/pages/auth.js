const express = require('express');
const router = express.Router();
const Users = require('../../db/users');

/* GET register page. */

// TODO validate input
router.get('/register', function (request, response, next) {
	response.render('public/register', { title: 'Register' });
});

router.post('/register', (request, response) => {
	const { username, email, password } = request.body;

	Users.register({ username, email, password })
		.then(handleLogin(request, response))
		.catch(handleLoginError(response, '/auth/register'));
});

/* GET login page. */
router.get('/login', function (request, response, next) {
	response.render('public/login', { title: 'Login' });
});

const handleLogin =
	(request, response) =>
	({ id, username }) => {
		request.session.authenticated = true;
		request.session.userId = id;
		request.session.username = username;

		response.redirect('/lobby');
	};

const handleLoginError = (response, redirectUri) => (error) => {
	console.log({ error });
	response.redirect(redirectUri);
};

router.post('/login', (request, response) => {
	const { username, password } = request.body;

	Users.login({ username, password })
		.then(handleLogin(request, response))
		.catch(handleLoginError(response, '/auth/login'));
});

/* GET logout page. */
router.get('/logout', function (request, response, next) {
	request.session.destroy((err) => {
		if (err) {
			console.log({ err });
			next(err);
		}

		response.redirect('/auth/login');
	});
});

module.exports = router;
