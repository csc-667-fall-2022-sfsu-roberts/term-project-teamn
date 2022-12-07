const db = require('./index');
const bcrypt = require('bcrypt');

const CREATE_PUBLIC =
	'INSERT INTO games ("userId") VALUES (${userId}) RETURNING id';

const CREATE_PRIVATE =
	'INSERT INTO games ("userId", "joinCode", "isPrivate" ) VALUES (${userId}, ${joinCode}, true) RETURNING id';

const GET_ALL_GAMES =
	'SELECT games.id, games."createdAt", number, "userId", "isPrivate", "joinCode", users.username FROM games, users where "userId" = "users"."id"';

const GET_GAMES_BY_USERID =
	'SELECT games.id, games."createdAt", "userId", number, "isPrivate", "joinCode", users.username FROM games JOIN users on "userId" = users.id WHERE "userId"=${userId}';

const GET_GAMES_BY_CODE = 'select id from games where "joinCode"=${code}';

const GET_MY_GAMES =
	'select * from game_users join games on game_id=id and user_id=${userId}';

const ADD_USER_SQL =
	'INSERT INTO game_users (game_id, user_id) VALUES (${game_id}, ${userId}) RETURNING game_id';

const LOOKUP_USER_IN_GAMEUSERS_BY_ID =
	'select user_id from game_users where game_id=${game_id} and user_id=${userId}';

const COUNT_PLAYERS =
	'SELECT COUNT(user_id) FROM game_users where id=${game_id};';

const UPDATE_GAME_PLAYERS_COUNT =
	'update games set number=number+1 where id=${game_id}';

const createPublicGame = ({ userId }) => {
	return db
		.one(CREATE_PUBLIC, { userId: userId })
		.then(({ id }) => {
			db.one(ADD_USER_SQL, { game_id: id, userId });
			return id;
		})
		.then((game_id) => {
			db.query(UPDATE_GAME_PLAYERS_COUNT, { game_id: game_id });
		});
};

const createPrivateGame = ({ userId, code }) => {
	return bcrypt.hash(toString(code), 10).then((hash) => {
		db.one(CREATE_PRIVATE, {
			userId: userId,
			joinCode: hash.substring(hash.length - 10, hash.length),
		})
			.then(({ id }) => {
				db.one(ADD_USER_SQL, { game_id: id, userId });
				return id;
			})
			.then((game_id) => {
				db.query(UPDATE_GAME_PLAYERS_COUNT, { game_id: game_id });
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
			db.one(ADD_USER_SQL, { game_id: el.id, userId });
			return el;
		})

		.then((el) => {
			db.query(UPDATE_GAME_PLAYERS_COUNT, { game_id: el.id });
		})
		.catch((err) => {
			return console.log(err);
		});
};

module.exports = {
	countPlayers,
	getMyGames,
	joinPrivateGame,
	joinPublicGame,
	createPrivateGame,
	getGamesByUserId,
	getAllGames,
	createPublicGame,
};
