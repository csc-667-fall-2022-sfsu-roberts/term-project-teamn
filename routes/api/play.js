const express = require('express');
const router = express.Router();
const Games = require('../../db/games');
const {getPlayerCards} = require("../../db/games");

router.post('/:gameId', async (request, response) => {
  const { gameId: gameIdStr } = request.params;
  const { action, card } = request.body;
  const { userId } = request.session;

  const gameId = parseInt(gameIdStr);

  let currentPlayer;
  try {
    currentPlayer = await Games.getCurrentSeat({
      gameId,
    });
  } catch (e) {
    response.sendStatus(400);
    return;
  }

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

    const newCard = await Games.getCard({ cardId: card })
    const currentCard = await Games.getGameCurrentCard({ gameId });

    if (newCard.type !== currentCard.type && newCard.color !== currentCard.color) {
      response.sendStatus(400);
      return;
    }

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
      await Games.updateCurrentCard({gameId, currentCard: card });
      const currentCard = await Games.getGameCurrentCard({ gameId })
      request.app.io.emit(`setCurrentCard:${gameId}`, {
        card: currentCard,
      });

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

  const game = await Games.getGame({
    game_id: gameId,
  })

  const nextSeat = (seat) % game.max_players + 1;
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
