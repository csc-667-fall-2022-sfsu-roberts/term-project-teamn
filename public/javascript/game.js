const gameSocket = io();

const gameId = parseInt(document.querySelector('#gameIdSpan').innerText);
const ownSeat = parseInt(document.querySelector('#seatSpan').innerText);

const playCard = async (id, color) => {
	const colorElem = document.querySelector('#color');

	await fetch(`/play/${gameId}`, {
		method: 'post',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			action: 'playCard',
			card: id,
			color: colorElem.value
		}),
	})
}

gameSocket.on(`setPlayerCards:${gameId}`, ({seat, cards}) => {
	if (seat !== ownSeat) {
		const board = document.querySelector('#board');
		const oldSeat = document.querySelector(`#seat-${seat}`);

		const seatEl = oldSeat || document.createElement('p');
		seatEl.id = `seat-${seat}`;
		seatEl.innerText = `Seat ${seat} has ${cards.length} cards`

		board.appendChild(seatEl);
	} else {
		const selfCards = document.querySelector('#selfCards');
		selfCards.innerHTML = "";

		cards.forEach((card) => {
			const cardEl = document.createElement('button');
			cardEl.textContent = `Play ${card.color} ${card.type}`;
			cardEl.addEventListener('click', async () => {
				await playCard(card.id);
			})
			selfCards.appendChild(cardEl);
		})
	}
});

gameSocket.on(`setTurnPlayer:${gameId}`, ({seat}) => {
	const selfTurn = seat === ownSeat;

	document.querySelector('#turnText').innerText = selfTurn ? 'Your turn' : 'Not your turn';
	const takeCardButton = document.querySelector('#takeCard');
	takeCardButton.disabled = !selfTurn;

	const selfCards = document.querySelector('#selfCards');
	selfCards.childNodes.forEach((child) => {
		child.disabled = !selfTurn;
	})
});

document.querySelector('#takeCard')
	.addEventListener('click', async () => {
		await fetch(`/play/${gameId}`, {
			method: 'post',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				action: 'takeCard'
			}),
		})
	});

gameSocket.on(`endGame:${gameId}`, () => {
	window.location.href = '/lobby'
});

gameSocket.on(`setCurrentCard:${gameId}`, ({ card }) => {
	const el = document.querySelector('#currentCard');
	el.innerText = `Current card is: ${card.color} ${card.type}`
});
