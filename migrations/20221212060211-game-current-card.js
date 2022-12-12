'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn(
      'games',
      'current_card',
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
