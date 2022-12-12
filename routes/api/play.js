const express = require('express');
const router = express.Router();
const Games = require('../../db/games');
const {getPlayerCards} = require("../../db/games");

router.post('/:gameId', async (request, response) => {
  const { gameId: gameIdStr } = request.params;
  const { action, card, color } = request.body;
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

  const game = await Games.getGame({
    game_id: gameId,
  })
  let seatIncrement = 1;

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

    if (newCard.type !== currentCard.type
      && newCard.color !== currentCard.color
      && newCard.color !== 'none'
      && !(currentCard.color === 'none' && game.last_color_picked === newCard.color)) {
      response.sendStatus(400);
      return;
    }

    switch (newCard.type) {
      case 10: // draw two
        const seatWhoGetCards = (seat) % game.max_players + game.game_direction;
        const cards = await Games.getSeatCards({
          gameId,
          seat: seatWhoGetCards,
        });
        for (let i = 0; i < 2; i++) {
          const unusedCards = await Games.getUnusedCards({ gameId })
          const newCard = unusedCards[Math.floor(Math.random() * unusedCards.length)];
          await Games.giveCardToPlayer({
            gameId,
            cardId: newCard.id,
            seat: seatWhoGetCards,
          })
          cards.push(newCard);
        }

        request.app.io.emit(`setPlayerCards:${gameId}`, {
          gameId,
          seat: seatWhoGetCards,
          cards,
        });
        break;
      case 11: // draw four
        if (!(['red', 'blue', 'green', 'yellow'].includes(color))) {
          response.sendStatus(400);
          return;
        }
        await Games.updateGameLastColorPicked({
          gameId,
          lastColorPicked: color,
        })

        const seatWhoGetCardsFour = (seat) % game.max_players + game.game_direction;
        const cardsFour = await Games.getSeatCards({
          gameId,
          seat: seatWhoGetCardsFour,
        });
        for (let i = 0; i < 4; i++) {
          const unusedCards = await Games.getUnusedCards({ gameId })
          const newCard = unusedCards[Math.floor(Math.random() * unusedCards.length)];
          await Games.giveCardToPlayer({
            gameId,
            cardId: newCard.id,
            seat: seatWhoGetCardsFour,
          })
        }
        cardsFour.push(newCard);

        request.app.io.emit(`setPlayerCards:${gameId}`, {
          gameId,
          seat: seatWhoGetCardsFour,
          cards: cardsFour,
        });
        break;
      case 12: // wild
        if (!(['red', 'blue', 'green', 'yellow'].includes(color))) {
          response.sendStatus(400);
          return;
        }
        await Games.updateGameLastColorPicked({
          gameId,
          lastColorPicked: color,
        })
        break;
      case 13: // reverse
        await Games.updateGameDirection({
          gameId,
          gameDirection: game.game_direction * -1,
        })
        game.game_direction *= -1;
        break;
      case 14: // skip
        seatIncrement = 2;
        break;
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

  let nextSeat = seat + game.game_direction * seatIncrement;
  while (nextSeat <= 0) {
    nextSeat += game.max_players;
  }
  while (nextSeat > game.max_players) {
    nextSeat -= game.max_players;
  }

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
