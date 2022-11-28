const db = require('./index');
const bcrypt = require('bcrypt');

const CREATE_PUBLIC =
	'INSERT INTO games ("userId") VALUES (${userId}) RETURNING id';

const CREATE_PRIVATE =
	'INSERT INTO games ("userId", "joinCode", "isPrivate" ) VALUES (${userId}, ${joinCode}, true) RETURNING id';

const GET_ALL_GAMES =
	'SELECT games.id, games."createdAt", "userId", "isPrivate", "joinCode", users.username FROM games, users where "userId" = "users"."id"';

const GET_GAMES_BY_USERID =
	'SELECT games.id, games."createdAt", "userId", "isPrivate", "joinCode", users.username FROM games JOIN users on "userId" = users.id WHERE "userId"=${userId}';

const createPublicGame = ({ userId }) => {
	return db.one(CREATE_PUBLIC, { userId: userId });
};

const createPrivateGame = ({ userId, code }) => {
	return bcrypt.hash(toString(code), 10).then((hash) => {
		db.one(CREATE_PRIVATE, {
			userId: userId,
			joinCode: hash.substring(hash.length - 10, hash.length),
		});
	});
};

const getAllGames = () => {
	return db.any(GET_ALL_GAMES);
};

const getGamesByUserId = ({ userId }) => {
	return db.any(GET_GAMES_BY_USERID, { userId: userId });
};

module.exports = {
	createPrivateGame,
	getGamesByUserId,
	getAllGames,
	createPublicGame,
};
