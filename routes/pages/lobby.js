const express = require('express');

const Games = require('../../db/games');

const router = express.Router();

router.get('/', (request, response) => {
	const { username, userId } = request.session;

	Games.getAllGames()
		.then((games) => {
			response.render('protected/lobby', {
				username,
				userId,
				games: games ? games : [],
				title: 'Lobby',
			});
		})
		.catch(handleNewPublicGameError(response, '/lobby'));
});

router.get('/create', (request, response) => {
	const { username, userId } = request.session;

	Games.getGamesByUserId({ userId })
		.then((games) => {
			response.render('protected/create', {
				username,
				userId,
				games: games ? games : [],

				title: 'Lobby',
			});
		})

		.catch(handleNewPublicGameError(response, '/lobby'));
});

const handleNewPublicGameError = (response, redirectUri) => (error) => {
	console.log({ error });
	response.redirect(redirectUri);
};

router.post('/generatePublicGame', (request, response) => {
	const { userId } = request.session;

	Games.createPublicGame({ userId })
		.then((res) => {
			response.redirect('/lobby/create');
		})
		.catch(handleNewPublicGameError(response, '/lobby'));
});

router.post('/generatePrivateGame', (request, response) => {
	const { userId } = request.session;

	const code = Date.now();

	Games.createPrivateGame({ userId, code })
		.then((res) => {
			response.redirect('/lobby/create');
		})
		.catch(handleNewPublicGameError(response, '/lobby'));
});

module.exports = router;
