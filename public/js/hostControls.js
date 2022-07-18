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

const maxAnswers = 4;
let questions = []
let maxQuestions = 0;
let score = 0;
let answeredA = 0,
    answeredB = 0,
    answeredC = 0,
    answeredD = 0;

let currentQuestion = 0;
let selectedAnswer = null;
let acceptingAnswers = false;

//to run on startup
// choiceContainers.forEach(container => {
//     container.addEventListener('click', () => {
//         if (!acceptingAnswers) return;
//         let choice = container.querySelector('.choice-text');
//         answerSelected(choice);
//     })
// })
start();


async function start() {
    
    await getQuestions();
    const serverQuestion = await (fetch('/api/currentQuestion'));
    currentQuestion = await serverQuestion.json();
    hostSetQuestion();
    setProgressBar();
    //in case host(s) close/refresh their window in the middle of a quiz, update their timer and make sure their answer tally is updated if timer
    const serverCount = await(fetch('/api/currentCount'));
    const currentCount = await serverCount.json();
    if(currentCount === 0) {
        getAnswerTally();
    }
}

function startQuiz() {
    socket.emit('startCountdown')
    acceptingAnswers = true;
}

function resetQuiz() {
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
    acceptingAnswers = true;
    choices.forEach(choice => {
        choice.classList.remove('correct');
        choice.classList.remove('incorrect');
    })
    question.innerText = questions[currentQuestion].question;
    for (let i = 0; i < maxAnswers; i++) {
        choices[i].innerText = questions[currentQuestion]['choice' + i]
    }
    [answeredA, answeredB, answeredC, answeredD] = [0, 0, 0, 0];
    answerCheck();
    fillVisualizerBar();
}
function setProgressBar() {
    progressText.innerText = `Question: ${currentQuestion + 1} / ${maxQuestions}`
    progressBarFull.style.width = `${(currentQuestion + 1) / maxQuestions * 100}%`;

}

// answer functions
// function answerSelected(e) {
//     choices.forEach(choice => {
//         choice.parentElement.classList.remove('selected')
//     })
//     selectedAnswer = e;
//     selectedAnswer.parentElement.classList.add('selected')
// }
function answerCheck() {
    const answer = questions[currentQuestion].answer;
    let classToApply = ''

    choices.forEach(e => {
        classToApply = (e.dataset.number == answer) ? 'correct' : 'incorrect'
        e.classList.add(classToApply);
    })
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

// socket.io
socket.on('currentCount', count => updateCount(count))
function updateCount(count) {
    if (!acceptingAnswers) return
        timerText.innerText = count;
    if (count === 0) {
        acceptingAnswers = false;
        //get answers after a delay in case something happened to cause the automatic update of the answers to be wrong
        setTimeout(getAnswerTally, 5000);
    }
}
socket.on('setQuestion', question => {
    currentQuestion = question;
    console.log(question)

    hostNextQuestion();
})
socket.on('updateAnswers', answer => updateAnswers(answer))

function updateAnswers(answer) {
    if (Object.keys(answer).length === 1) {
        let key = Object.keys(answer)[0]
        switch (key) {
            case "0":
                console.log("case 0")
                answeredA = answer[key];
                break;
            case "1":
                console.log("case 1")
                answeredB = answer[key];
                break;
            case "2":
                console.log("case 2")
                answeredC = answer[key];
                break;
            case "3":
                console.log("case 3")
                answeredD = answer[key];
                break;
        }
        fillVisualizerBar();
    }
}
