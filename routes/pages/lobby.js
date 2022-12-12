const express = require('express');
const moment = require('moment');

const Games = require('../../db/games');

const router = express.Router();

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

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
			response.redirect(`/lobby/mygames`);
		})
		.catch(handleNewPublicGameError(response, '/lobby'));
});

router.post('/generatePrivateGame', (request, response) => {
	const { userId } = request.session;

	const code = Date.now();

	Games.createPrivateGame({ userId, code })
		.then((res) => {
			response.redirect(`/lobby/mygames`);
		})
		.catch(handleNewPublicGameError(response, '/lobby'));
});

router.post('/joinPrivateGame', (request, response) => {
	const { userId } = request.session;
	const { code } = request.body;

	Games.joinPrivateGame({ userId, code })
		.then((res) => {
			response.redirect(`/lobby/game/${res.id}`);
		})
		.catch(handleNewPublicGameError(response, '/lobby'));
});

router.post('/join/:id', (request, response) => {
	const { userId } = request.session;
	const gameId = request.params.id;

	Games.joinPublicGame({ userId, gameId: parseInt(gameId, 10) })
		.then((res) => {
			response.redirect(`/lobby/game/${gameId}`);
		})
		.catch(handleNewPublicGameError(response, '/lobby'));
});

router.get('/game/:id', async (request, response) => {
	const { username, userId } = request.session;

	const gameId = request.params.id;
	const game = await Games.getGame({
		game_id: gameId
	})
	const gameStarted = await Games.gameStarted(gameId);

	if (game.number === 2 && !await Games.gameStarted(gameId)) {
		await Games.updateSeatState({
			gameId,
			seat: 1,
			current: true,
		})
	}

	const userSeat = await Games.getPlayerSeat({
		gameId, userId
	})

	response.render('protected/playTable', {
		username: username,
		title: 'Lobby',
		userId: userId,
		gameId: gameId,
		seat: userSeat.seat
	});

	await sleep(3000);


	if (game.number === 2 && !gameStarted) {
		for (let seat = 1; seat <= 2; seat++) {
			const cardsForSeat = [];
			for (let card = 0; card < 7; card++) {
				const unusedCards = await Games.getUnusedCards({ gameId })
				const card = unusedCards[Math.floor(Math.random()*unusedCards.length)];
				await Games.giveCardToPlayer({
					gameId,
					cardId: card.id,
					seat
				})
				cardsForSeat.push(card);
			}

			request.app.io.emit(`setPlayerCards:${gameId}`, {
				gameId,
				seat,
				cards: cardsForSeat
			});
		}

		request.app.io.emit(`setTurnPlayer:${gameId}`, {
			seat: 1
		});
	}
});

module.exports = router;
