'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn(
      'games',
      'max_players',
      Sequelize.INTEGER
    )
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      'games',
      'max_players',
    )
  }
};
