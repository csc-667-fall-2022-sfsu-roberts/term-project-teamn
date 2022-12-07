const express = require('express');
const moment = require('moment');

const Games = require('../../db/games');

const router = express.Router();

router.get('/', (request, response) => {
	const { username, userId } = request.session;

	Games.getAllGames()
		.then((games) => {
			games.forEach((game) => {
				game.createdAt = moment(game.createdAt).fromNow();
			});

			response.render('protected/lobby', {
				username,
				userId,
				games: games ? games : [],
				title: 'Lobby',
			});
		})
		.catch(handleNewPublicGameError(response, '/lobby'));
});

router.get('/mygames', (request, response) => {
	const { username, userId } = request.session;

	Games.getMyGames({ userId })
		.then((games) => {
			games.forEach((game) => {
				game.createdAt = moment(game.createdAt).fromNow();
			});

			response.render('protected/mygames', {
				username,
				userId,
				games: games ? games : [],
				title: 'Active Games',
			});
		})

		.catch(handleNewPublicGameError(response, '/lobby'));
});

router.get('/create', (request, response) => {
	const { username, userId } = request.session;

	Games.getGamesByUserId({ userId })
		.then((games) => {
			games.forEach((game) => {
				game.createdAt = moment(game.createdAt).fromNow();
			});

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
			response.redirect('/lobby/mygames');
		})
		.catch(handleNewPublicGameError(response, '/lobby'));
});

router.post('/generatePrivateGame', (request, response) => {
	const { userId } = request.session;

	const code = Date.now();

	Games.createPrivateGame({ userId, code })
		.then((res) => {
			response.redirect('/lobby/mygames');
		})
		.catch(handleNewPublicGameError(response, '/lobby'));
});

router.post('/joinPrivateGame', (request, response) => {
	const { userId } = request.session;
	const { code } = request.body;

	Games.joinPrivateGame({ userId, code })
		.then((res) => {
			response.redirect('/lobby/mygames');
		})
		.catch(handleNewPublicGameError(response, '/lobby'));
});

router.post('/join/:id', (request, response) => {
	const { userId } = request.session;
	const gameId = request.params.id;

	Games.joinPublicGame({ userId, gameId })
		.then((res) => {
			response.redirect('/lobby/mygames');
		})
		.catch(handleNewPublicGameError(response, '/lobby'));
});

router.get('/game/:id', (request, response) => {
	const { username, userId } = request.session;

	const gameId = request.params.id;

	response.render('protected/playTable', {
		username: username,
		title: 'Lobby',
		userId: userId,
		gameId: gameId,
	});
});

module.exports = router;
