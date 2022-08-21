 const socket = io(); 
 
 const finalScore = document.getElementById('finalScore');
 const mostRecentScore = localStorage.getItem('aartMostRecentScore');

 finalScore.innerText = mostRecentScore;

socket.on('setQuestion', () => {
    window.location.replace('/quiz')
})