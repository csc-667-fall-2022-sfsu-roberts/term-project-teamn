const express = require('express');
const router = express.Router();
const Games = require('../../db/games');
const {getPlayerCards} = require("../../db/games");

router.post('/:gameId', async (request, response) => {
  const { gameId: gameIdStr } = request.params;
  const { action, card } = request.body;
  const { userId } = request.session;

  const gameId = parseInt(gameIdStr);

  const currentPlayer = await Games.getCurrentSeat({
    gameId,
  });

  if (currentPlayer.user_id !== userId) {
    return response.sendStatus(400);
  }
  const { seat } = currentPlayer;

  if (action === 'takeCard') {
    const cards = await getPlayerCards({
      gameId,
      userId,
    });
    const unusedCards = await Games.getUnusedCards({ gameId })
    const newCard = unusedCards[Math.floor(Math.random()*unusedCards.length)];
    await Games.giveCardToPlayer({
      gameId,
      cardId: newCard.id,
      seat
    })
    cards.push(newCard);

    request.app.io.emit(`setPlayerCards:${gameId}`, {
      gameId,
      seat,
      cards,
    });
  } else if (action === 'playCard') {
    try {
      await Games.playerHasCard({
        gameId,
        userId,
        cardId: card,
      })
    } catch (e) {
      response.sendStatus(400);
      return;
    }

    // verify that card can be placed

    await Games.deleteCard({
      gameId,
      userId,
      cardId: card,
    });

    const cards = await getPlayerCards({
      gameId,
      userId,
    });

    if (cards.length === 0) {
      request.app.io.emit(`endGame:${gameId}`);
      await Games.cleanupGame({ gameId });
      return;
    } else {
      request.app.io.emit(`setPlayerCards:${gameId}`, {
        gameId,
        seat,
        cards,
      });
    }
  } else {
    response.sendStatus(400);
    return;
  }

  const nextSeat = (seat) % 2 + 1;
  await Games.updateSeatState({
    gameId,
    seat: seat,
    current: false,
  });
  await Games.updateSeatState({
    gameId,
    seat: nextSeat,
    current: true,
  });
  request.app.io.emit(`setTurnPlayer:${gameId}`, {
    seat: nextSeat
  });
  response.sendStatus(200);
});

module.exports = router;
