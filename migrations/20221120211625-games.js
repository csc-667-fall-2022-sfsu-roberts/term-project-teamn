'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable('games', {
			id: {
				type: Sequelize.INTEGER,
				primaryKey: true,
				autoIncrement: true,
			},
			userId: {
				type: Sequelize.INTEGER,
				allowNull: false,
			},
			isPrivate: {
				type: Sequelize.BOOLEAN,
				defaultValue: false,
				allowNull: false,
			},
			number: {
				type: Sequelize.INTEGER,
				defaultValue: 0,
			},
			createdAt: {
				type: Sequelize.DATE,
				defaultValue: Sequelize.literal('NOW()'),
				allowNull: false,
			},
			joinCode: {
				type: Sequelize.STRING,
				defaultValue: '',
				allowNull: false,
			},
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('games');
	},
};
