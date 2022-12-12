'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn(
      'games',
      'game_direction',
      {
        type: Sequelize.INTEGER,
        defaultValue: 1
      }
    )
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      'games',
      'game_direction',
    )
  }
};
