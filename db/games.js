const { INTEGER, STRING } = require('sequelize');
const db = require('./index');

const CREATE_PUBLIC =
	'INSERT INTO games ("userId") VALUES (${userId}) RETURNING id';

const GET_ALL_GAMES = 'SELECT * FROM games';

const createPublicGame = ({ userId }) => {
	return db.one(CREATE_PUBLIC, { userId: userId });
};

const getAllGames = () => {
	return db.any(GET_ALL_GAMES);
};

module.exports = { getAllGames, createPublicGame };
