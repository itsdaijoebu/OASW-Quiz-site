const socket = io();

const question = document.getElementById(`question`);
const choices = Array.from(document.getElementsByClassName(`choice-text`));
const choiceContainers = Array.from(document.querySelectorAll(`.choice-container`));
const scoreText = document.getElementById('score-text');
const progressText = document.getElementById('progress-text');
const progressBar = document.getElementById('progress-bar')
const progressBarFull = document.getElementById('progress-bar-full');
const timerText = document.getElementById('timer-text')

//dev stuff
const nextQuestionButton = document.querySelector('#nextQ')

// selectors for visualizer for responses given by all participants
const visualizerSection = document.querySelector("#visualizer-section")
const visualizerTextA = document.querySelector("#visualizer-text-a")
const visualizerTextB = document.querySelector("#visualizer-text-b")
const visualizerTextC = document.querySelector("#visualizer-text-c")
const visualizerTextD = document.querySelector("#visualizer-text-d")
const visualizerFullA = document.querySelector("#visualizer-a-full")
const visualizerFullB = document.querySelector("#visualizer-b-full")
const visualizerFullC = document.querySelector("#visualizer-c-full")
const visualizerFullD = document.querySelector("#visualizer-d-full")

let questions = []
let maxQuestions = 0;
const maxAnswers = 4;
let score = 0;

let answeredA = 0,
    answeredB = 0,
    answeredC = 0,
    answeredD = 0;

let currentQuestion = 0;
let selectedAnswer = null;
let acceptingAnswers = false;

//to run on startup
choiceContainers.forEach(container => {
    container.addEventListener('click', () => {
        if (!acceptingAnswers) return;
        let choice = container.querySelector('.choice-text');
        answerSelected(choice);
    })
})
start();

async function start() {
    await getQuestions();
    await nextQuestion();
    // in case user entering after quiz already started or had to refresh their page after a question is done, get answer tally
    const serverCount = await (fetch('/api/currentCount'));
    const currentCount = await serverCount.json();
    if (currentCount === 0) {
        getAnswerTally();
    }
    let recentScore = localStorage.getItem('mostRecentScore')
    if(recentScore) score = recentScore
}

// question and progress functions
async function getQuestions() {
    const res = await (fetch(`/api/allQuestions`));
    questions = await res.json();
    maxQuestions = questions.length;
}
function nextQuestion() {
    selectedAnswer = null;
    setQuestion();
    setProgressBar();
}
function setQuestion() {
    [answeredA, answeredB, answeredC, answeredD] = [0, 0, 0, 0];
    choices.forEach(choice => {
        choice.parentElement.classList.remove('selected')
        choice.classList.remove('correct')
        choice.classList.remove('incorrect')
    })
    question.innerText = questions[currentQuestion].question;
    for (let i = 0; i < maxAnswers; i++) {
        choices[i].innerText = questions[currentQuestion]['choice' + i]
    }
    acceptingAnswers = true;
}
function setProgressBar() {
    progressText.innerText = `Question: ${currentQuestion + 1}/${maxQuestions}`
    progressBarFull.style.width = `${(currentQuestion + 1) / maxQuestions * 100}%`;
}

// answer and score functions
function answerSelected(e) {
    choices.forEach(choice => {
        choice.parentElement.classList.remove('selected')
    })
    selectedAnswer = e;
    selectedAnswer.parentElement.classList.add('selected')
}
function revealAnswers() {
    visualizerSection.classList.remove('invisible');
    acceptingAnswers = false;
    const answer = questions[currentQuestion].answer;
    let classToApply = ''

    if (selectedAnswer) {
        if (selectedAnswer.dataset.number == answer)
            incrementScore();
    }
    choices.forEach(choice => {
        classToApply = (choice.dataset.number == answer) ? 'correct' : 'incorrect'
        choice.classList.add(classToApply);
    })
}
function submitAnswers() {
    if (selectedAnswer)
        socket.emit('submitAnswer', selectedAnswer.dataset.number)
}

function incrementScore() {
    scoreText.innerText = ++score;
    localStorage.setItem('mostRecentScore', score);
    console.log(score)
}

// Answer visualizer
function fillVisualizerBar() {
    let total = answeredA + answeredB + answeredC + answeredD;
    let aP = Math.floor((answeredA / total) * 100);
    let bP = Math.floor((answeredB / total) * 100);
    let cP = Math.floor((answeredC / total) * 100);
    let dP = Math.floor((answeredD / total) * 100);

    if (!aP) aP = 0;
    if (!bP) bP = 0;
    if (!cP) cP = 0;
    if (!dP) dP = 0;

    visualizerTextA.innerText = `${aP}%`;
    visualizerTextB.innerText = `${bP}%`;
    visualizerTextC.innerText = `${cP}%`;
    visualizerTextD.innerText = `${dP}%`;

    visualizerFullA.style.width = `${aP}%`;
    visualizerFullB.style.width = `${bP}%`;
    visualizerFullC.style.width = `${cP}%`;
    visualizerFullD.style.width = `${dP}%`;
}
async function getAnswerTally() {
    console.log('get answer tally')
    const res = await (fetch(`/api/currentAnswerTally`));
    const answerObject = await res.json();
    const answerTally = answerObject[0];
    for (let answerIndex in answerTally) {
        if (answerIndex === "_id" || answerIndex === "question") continue
        updateAnswers({ [answerIndex]: answerTally[answerIndex] })
    }
}


// websocket stuff
socket.on('message', message => {
    console.log(message);
})

socket.on('currentCount', count => {
    if (acceptingAnswers)
        updateCount(count)
})
function updateCount(count) {
    timerText.innerText = count;
    if (count === 0) {
        console.log('reveal!');
        revealAnswers();
        submitAnswers();
        //get answers after a delay in case something happened to cause the automatic update of the answers to be wrong
        setTimeout(getAnswerTally, 5000);
    }
}

socket.on('setQuestion', (question, reset = false) => {
    if (reset) {
        score = 0;
        localStorage.setItem('mostRecentScore', 0)
        scoreText.innerText = score;
    }
    if (question >= maxQuestions) {
        console.log('max q')
        window.location.replace('/results')
    } else {
        visualizerSection.classList.add('invisible');
        currentQuestion = question;
        nextQuestion();
    }
})

socket.on('updateAnswers', answer => updateAnswers(answer))

function updateAnswers(answer) {
    if (Object.keys(answer).length === 1) {
        let key = Object.keys(answer)[0]
        switch (key) {
            case "0":
                answeredA = answer[key];
                break;
            case "1":
                answeredB = answer[key];
                break;
            case "2":
                answeredC = answer[key];
                break;
            case "3":
                answeredD = answer[key];
                break;
        }
        fillVisualizerBar();
    }
}