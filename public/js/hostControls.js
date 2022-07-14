const socket = io();

const question = document.getElementById(`question`);
const choices = Array.from(document.getElementsByClassName(`choice-text`));
const choiceContainers = Array.from(document.querySelectorAll(`.choice-container`));
const progressText = document.getElementById('progress-text');
const progressBar = document.getElementById('progress-bar');
const progressBarFull = document.getElementById('progress-bar-full');
const timerText = document.getElementById('timer-text');

//host stuff
const nextQuestionButton = document.getElementById('host-next');
nextQuestionButton.addEventListener('click', () => socket.emit('goNextQuestion'));
const prevQuestionButton = document.getElementById('host-previous');
prevQuestionButton.addEventListener('click', () => socket.emit('goPrevQuestion'));

const resetButton = document.getElementById('host-reset');
resetButton.addEventListener('click', resetQuiz);
const startButton = document.getElementById('host-start');
startButton.addEventListener('click', startQuiz);


// selectors for visualizer for responses given by all participants
const visualizerSection = document.querySelector("#visualizer-section");
const visualizerTextA = document.querySelector("#visualizer-text-a");
const visualizerTextB = document.querySelector("#visualizer-text-b");
const visualizerTextC = document.querySelector("#visualizer-text-c");
const visualizerTextD = document.querySelector("#visualizer-text-d");
const visualizerFullA = document.querySelector("#visualizer-a-full");
const visualizerFullB = document.querySelector("#visualizer-b-full");
const visualizerFullC = document.querySelector("#visualizer-c-full");
const visualizerFullD = document.querySelector("#visualizer-d-full");

let questions = []
let maxQuestions = 0;
const maxAnswers = 4;
let score = 0;

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
    const serverQuestion = await (fetch('/api/currentQuestion'));
    currentQuestion = await serverQuestion.json();
    hostSetQuestion();
    setProgressBar();
}

function startQuiz() {
    socket.emit('startCountdown')
}

async function resetQuiz() {
    socket.emit('resetQuiz')
    start();
}

// question and progress functions
async function getQuestions() {
    const res = await (fetch(`/api/allQuestions`));
    questions = await res.json();
    maxQuestions = questions.length;
}
function hostNextQuestion() {
    hostSetQuestion();
    setProgressBar();
}
function hostSetQuestion() {
    choices.forEach(choice => {
        choice.classList.remove('correct');
        choice.classList.remove('incorrect');
    })
    question.innerText = questions[currentQuestion].question;
    for (let i = 0; i < maxAnswers; i++) {
        choices[i].innerText = questions[currentQuestion]['choice' + i]
    }
    answerCheck();
}
function setProgressBar() {
    progressText.innerText = `Question: ${currentQuestion + 1} / ${maxQuestions}`
    progressBarFull.style.width = `${(currentQuestion + 1) / maxQuestions * 100}%`;

}

// answer functions
function answerSelected(e) {
    choices.forEach(choice => {
        choice.parentElement.classList.remove('selected')
    })
    selectedAnswer = e;
    selectedAnswer.parentElement.classList.add('selected')
}
function answerCheck() {
    acceptingAnswers = false;
    const answer = questions[currentQuestion].answer;
    let classToApply = ''

    choices.forEach(e => {
        classToApply = (e.dataset.number == answer) ? 'correct' : 'incorrect'
        e.classList.add(classToApply);
    })
}

// web sockets
socket.on('currentCount', count => updateCount(count))
function updateCount(count) {
    timerText.innerText = count;
}
socket.on('setQuestion', question => {
    currentQuestion = question;
    console.log(question)

    hostNextQuestion();
})
