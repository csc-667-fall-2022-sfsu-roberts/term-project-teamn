const express = require('express');

const Games = require('../../db/games');

const router = express.Router();

router.get('/', (request, response) => {
	const { username, userId } = request.session;

	Games.getAllGames()
		.then((games) => {
			console.log(games);
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

	response.render('protected/create', {
		username,
		userId,
		title: 'Create a game',
	});
});

const handleNewPublicGameError = (response, redirectUri) => (error) => {
	console.log({ error });
	response.redirect(redirectUri);
};

router.post('/generatePublicGame', (request, response) => {
	const { userId } = request.session;

	Games.createPublicGame({ userId })
		.then((res) => {
			response.render('/lobby', {
				username,
				userId,
				title: 'Create a game',
			});
		})
		.catch(handleNewPublicGameError(response, '/lobby'));
});

module.exports = router;
