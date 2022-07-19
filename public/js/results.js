 const socket = io(); 
 
 const finalScore = document.getElementById('finalScore');
 const mostRecentScore = localStorage.getItem('mostRecentScore');

 finalScore.innerText = mostRecentScore;

socket.on('setQuestion', () => {
    window.location.replace('/quiz')
})