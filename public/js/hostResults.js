const socket = io();

document.getElementById('restart').addEventListener('click', () => socket.emit('resetQuiz'))