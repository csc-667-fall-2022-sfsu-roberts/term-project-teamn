const db = require('./index');
const bcrypt = require('bcrypt');

const CREATE_PUBLIC =
	'INSERT INTO games ("userId") VALUES (${userId}) RETURNING id';

const CREATE_PRIVATE =
	'INSERT INTO games ("userId", "joinCode", "isPrivate" ) VALUES (${userId}, ${joinCode}, true) RETURNING id';

const GET_ALL_GAMES = 'SELECT * FROM games';

const GET_GAMES_BY_USERID = 'SELECT * FROM games WHERE "userId"=${userId}';

const createPublicGame = ({ userId }) => {
	return db.one(CREATE_PUBLIC, { userId: userId });
};

const createPrivateGame = ({ userId, code }) => {
	console.log(code);

	return bcrypt.hash(toString(code), 10).then((hash) => {
		db.one(CREATE_PRIVATE, {
			userId: userId,
			joinCode: hash.substring(0, 10),
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
