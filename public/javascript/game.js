const gameSocket = io();

const gameId = parseInt(document.querySelector('#gameIdSpan').innerText);
const ownSeat = parseInt(document.querySelector('#seatSpan').innerText);
console.log(gameId);
console.log(ownSeat);

gameSocket.on(`setPlayerCards:${gameId}`, ({seat, cards}) => {
	const board = document.querySelector('#board');
	const oldSeat = document.querySelector(`#seat-${seat}`);

	if (oldSeat) {
		oldSeat.remove();
	}

	const seatEl = document.createElement('p');
	seatEl.id = `#seat-${seat}`;
	seatEl.innerText = JSON.stringify(cards)

	board.appendChild(seatEl);
});

gameSocket.on(`setTurnPlayer:${gameId}`, ({seat}) => {
	const actions = document.querySelector('#actions');
	actions.textContent = seat === ownSeat ? 'Your turn' : 'Not your turn'
});
