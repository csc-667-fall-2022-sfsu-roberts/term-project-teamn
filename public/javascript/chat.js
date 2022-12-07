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

	document.getElementById('chats').scrollBy({
		top: 100,
		behavior: 'smooth',
	});

	messages.scrollBy({
		top: 100,
		behavior: 'smooth',
	});

	document.querySelector('#message-field').value = '';
});

if (document.querySelector("[id^='socket-chat']")) {
	const chatId = document.querySelector("[id^='socket-chat']").value;

	document
		.querySelector('#private-message-field')
		.addEventListener('keydown', (event) => {
			if (event.keyCode === 13) {
				fetch(`/chat/${chatId}`, {
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

	const messages1 = document.querySelector('#private-messages');

	socket.on(`chat:${chatId}`, ({ sender, user, message, timestamp }) => {
		const template1 = document.querySelector('#private-message');

		const content1 = template1.content.cloneNode(true);
		content1.querySelector('.private-sender').innerText = sender;
		content1.querySelector('.private-content').innerText = message;

		const date = new Date(timestamp);

		if (document.querySelector(`.private-userId-${user}`) !== null) {
			content1
				.querySelector('.private-message-body')
				.classList.add('private-message-body-right');
			content1
				.querySelector('.private-sender')
				.classList.add('private-messages-right');
			content1
				.querySelector('.private-content')
				.classList.add('private-content-right');
		}

		content1.querySelector('.private-timestamp').innerText = `${
			date.getHours() < 10 ? '0' + date.getHours() : date.getHours()
		}:${
			date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()
		}:${
			date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds()
		} ${date.toDateString()}`;

		messages1.appendChild(content1);

		document.getElementById('chats').scrollBy({
			top: 100,
			behavior: 'smooth',
		});

		messages1.scrollBy({
			top: 100,
			behavior: 'smooth',
		});

		document.querySelector('#private-message-field').value = '';
	});
}
