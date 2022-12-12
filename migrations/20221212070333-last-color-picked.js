'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn(
      'games',
      'last_color_picked',
      {
        type: Sequelize.STRING,
      }
    )
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      'games',
      'last_color_picked',
    )
  }
};
