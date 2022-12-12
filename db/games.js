const db = require('./index');
const bcrypt = require('bcrypt');

const CREATE_PUBLIC =
	'INSERT INTO games ("userId", max_players) VALUES (${userId}, ${maxPlayers}) RETURNING id';

const CREATE_PRIVATE =
	'INSERT INTO games ("userId", "joinCode", "isPrivate", max_players ) VALUES (${userId}, ${joinCode}, true, ${maxPlayers})) RETURNING id';

const GET_ALL_GAMES =
	'SELECT games.max_players, games.id, games."createdAt", number, "userId", "isPrivate", "joinCode", users.username FROM games, users where "userId" = "users"."id"';

const GET_GAMES_BY_USERID =
	'SELECT games.max_players, games.id, games."createdAt", "userId", number, "isPrivate", "joinCode", users.username FROM games JOIN users on "userId" = users.id WHERE "userId"=${userId}';

const GET_GAMES_BY_CODE = 'select id from games where "joinCode"=${code}';

const GET_MY_GAMES =
	'select * from game_users join games on game_id=id where user_id=${userId}';

const ADD_USER_SQL =
	'INSERT INTO game_users (game_id, user_id, seat) VALUES (${game_id}, ${userId}, ' +
	'(SELECT (SELECT COALESCE((SELECT seat FROM game_users WHERE game_id = ${game_id} ORDER BY seat DESC LIMIT 1), 0))+1)) RETURNING game_id';

const GET_GAME =
	'SELECT * FROM games WHERE id = ${game_id}'

const LOOKUP_USER_IN_GAMEUSERS_BY_ID =
	'select user_id from game_users where game_id=${game_id} and user_id=${userId}';

const COUNT_PLAYERS =
	'SELECT COUNT(user_id) FROM game_users where id=${game_id};';

const UPDATE_GAME_PLAYERS_COUNT =
	'update games set number=number+1 where id=${game_id}';

const GET_UNUSED_CARDS =
	'SELECT * FROM cards WHERE id NOT IN (SELECT card_id FROM game_cards WHERE game_id = ${game_id});';

const GIVE_CARD_TO_SEAT =
	'INSERT INTO game_cards (game_id, card_id, user_id) VALUES (${gameId}, ${cardId}, (SELECT user_id FROM game_users WHERE game_id = ${gameId} AND seat = ${seat}))';

const GET_CURRENT_PLAYER =
	'SELECT seat FROM game_users WHERE game_id=${game_id} AND current = TRUE;';

const SET_CURRENT_SEAT =
	'UPDATE game_users SET current = ${current} WHERE game_id = ${gameId} AND seat = ${seat}'

const GET_PLAYER_SEAT =
	'SELECT seat FROM game_users WHERE game_id=${game_id} AND user_id=${user_id};';

const GET_CURRENT_SEAT =
	'SELECT user_id, seat FROM game_users WHERE game_id=${game_id} AND current=TRUE;';

const GET_PLAYER_CARDS =
	'SELECT * FROM game_cards JOIN cards c on c.id = game_cards.card_id WHERE game_id=${gameId} AND user_id=${userId};'

const GET_SEAT_CARDS =
	'SELECT * FROM game_cards' +
	' JOIN cards c on c.id = game_cards.card_id' +
	' JOIN game_users gu on game_cards.game_id = gu.game_id and game_cards.user_id = gu.user_id' +
	' WHERE game_cards.game_id = ${gameId} AND seat=${seat};'

const GET_PLAYER_CARD =
	'SELECT * FROM game_cards WHERE game_id=${gameId} AND user_id=${userId} AND card_id=${cardId}'

const DELETE_CARD =
	'DELETE FROM game_cards WHERE game_id = ${gameId} AND card_id = ${cardId} AND user_id = ${userId}'

const CLEANUP_GAME =
	'DELETE FROM games WHERE id=${gameId}';

const CLEANUP_GAME_CARDS =
	'DELETE FROM game_cards WHERE game_id=${gameId}';

const CLEANUP_GAME_USERS =
	'DELETE FROM game_users WHERE game_id=${gameId}';

const createPublicGame = ({ userId, maxPlayers }) => {
	return db
		.one(CREATE_PUBLIC, { userId: userId, maxPlayers })
		.then(({ id }) => {
			db.one(ADD_USER_SQL, { game_id: id, userId });
			return id;
		})
		.then((game_id) => {
			db.query(UPDATE_GAME_PLAYERS_COUNT, { game_id: game_id });
			return game_id;
		});
};

const createPrivateGame = ({ userId, code, maxPlayers }) => {
	return bcrypt.hash(toString(code), 10).then((hash) => {
		db.one(CREATE_PRIVATE, {
			userId: userId,
			joinCode: hash.substring(hash.length - 10, hash.length),
			maxPlayers,
		})
			.then(({ id }) => {
				db.one(ADD_USER_SQL, { game_id: id, userId });
				return id;
			})
			.then((game_id) => {
				db.query(UPDATE_GAME_PLAYERS_COUNT, { game_id: game_id });
				return game_id
			});
	});
};

const getAllGames = () => {
	return db.any(GET_ALL_GAMES);
};

const getMyGames = ({ userId }) => {
	return db.any(GET_MY_GAMES, { userId: userId });
};

const getGamesByUserId = ({ userId }) => {
	return db.any(GET_GAMES_BY_USERID, { userId: userId });
};

const countPlayers = ({ game_id }) => {
	return db.any(COUNT_PLAYERS, { game_id: game_id });
};

const getGame = ({ game_id }) => {
	return db.one(GET_GAME, { game_id })
}

const joinPublicGame = ({ userId, gameId }) => {
	return db
		.none(LOOKUP_USER_IN_GAMEUSERS_BY_ID, {
			game_id: gameId,
			userId,
		})
		.then(() => db.one(ADD_USER_SQL, { game_id: gameId, userId }))
		.then(() => {
			db.query(UPDATE_GAME_PLAYERS_COUNT, { game_id: gameId });
		});
};

const joinPrivateGame = ({ userId, code }) => {
	return db
		.one(GET_GAMES_BY_CODE, { userId, code })
		.then((el) => {
			db.none(LOOKUP_USER_IN_GAMEUSERS_BY_ID, {
				game_id: el.id,
				userId,
			});
			return el;
		})
		.then((el) => {
			db.one(ADD_USER_SQL, { game_id: el.id, userId })
			return el;
		})
		.then((el) => {
			db.query(UPDATE_GAME_PLAYERS_COUNT, { game_id: el.id });
			return el;
		})
		.catch((err) => {
			return console.log(err);
		});
};

const getUnusedCards = ({ gameId }) => {
	return db.any(GET_UNUSED_CARDS, {
		game_id: gameId
	})
	.catch((err) => {
		return console.log(err);
	});
}

const giveCardToPlayer = ({ gameId, cardId, seat }) => {
	return db.any(GIVE_CARD_TO_SEAT, {
		gameId,
		cardId,
		seat,
	})
}

const gameStarted = ({ gameId }) => {
	return db.any(GET_CURRENT_PLAYER, {
		game_id: gameId,
	})
}

const updateSeatState = ({gameId, seat, current}) => {
	return db.any(SET_CURRENT_SEAT, {
		gameId, seat, current
	})
}

const getPlayerSeat = ({gameId, userId}) => {
	return db.one(GET_PLAYER_SEAT, {
		game_id: gameId,
		user_id: userId,
	})
}

const getCurrentSeat = ({gameId}) => {
	return db.one(GET_CURRENT_SEAT, {
		game_id: gameId,
	})
}

const getPlayerCards = ({gameId, userId}) => {
	return db.any(GET_PLAYER_CARDS, {
		gameId,
		userId,
	})
}

const getSeatCards = ({gameId, seat}) => {
	return db.any(GET_SEAT_CARDS, {
		gameId,
		seat,
	})
}

const playerHasCard = ({gameId, userId, cardId}) => {
	return db.one(GET_PLAYER_CARD, {
		gameId,
		userId,
		cardId,
	})
}

const deleteCard = ({gameId, userId, cardId}) => {
	return db.any(DELETE_CARD, {
		gameId,
		userId,
		cardId,
	})
}

const cleanupGame = ({gameId}) => {
	return db.any(CLEANUP_GAME_CARDS, { gameId })
		.then(() => db.any(CLEANUP_GAME_USERS, { gameId }))
		.then(() => db.any(CLEANUP_GAME, { gameId }))
}

module.exports = {
	countPlayers,
	getMyGames,
	joinPrivateGame,
	joinPublicGame,
	createPrivateGame,
	getGamesByUserId,
	getAllGames,
	createPublicGame,
	getGame,
	getUnusedCards,
	giveCardToPlayer,
	gameStarted,
	updateSeatState,
	getPlayerSeat,
	getCurrentSeat,
	getPlayerCards,
	getSeatCards,
	playerHasCard,
	deleteCard,
	cleanupGame,
};
