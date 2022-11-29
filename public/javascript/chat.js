const socket = io();

document
	.querySelector('#message-field')
	.addEventListener('keydown', (event) => {
		if (event.keyCode === 13) {
			fetch('/chat/0', {
				method: 'post',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ message: event.target.value }),
			})
				.then(() => {
					document.querySelector('#message').value = '';
				})
				.catch((error) => console.log(error));
		}
	});

const messages = document.querySelector('#messages');

socket.on('chat:0', ({ sender, user, message, timestamp }) => {
	const template = document.querySelector('#message');

	const content = template.content.cloneNode(true);
	content.querySelector('.sender').innerText = sender;
	content.querySelector('.content').innerText = message;

	const date = new Date(timestamp);

	if (document.querySelector(`.userId-${user}`) !== null) {
		content
			.querySelector('.message-body')
			.classList.add('message-body-right');
		content.querySelector('.sender').classList.add('messages-right');
		content.querySelector('.content').classList.add('content-right');
	}

	content.querySelector('.timestamp').innerText = `${
		date.getHours() < 10 ? '0' + date.getHours() : date.getHours()
	}:${date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()}:${
		date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds()
	} ${date.toDateString()}`;

	messages.appendChild(content);

	messages.scrollBy({
		top: 100,
		behavior: 'smooth',
	});

	document.querySelector('#message-field').value = '';
});
