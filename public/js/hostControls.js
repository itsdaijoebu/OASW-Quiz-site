const question = document.getElementById(`question`);
const choices = Array.from(document.getElementsByClassName(`choice-text`));
const choiceContainers = Array.from(document.querySelectorAll(`.choice-container`));
const progressText = document.getElementById('progress-text');
const progressBar = document.getElementById('progress-bar')
const progressBarFull = document.getElementById('progress-bar-full');
const timerText = document.getElementById('timer-text')

//host stuff
const nextQuestionButton = document.getElementById('host-next')
nextQuestionButton.addEventListener('click', hostNextQuestion)
const resetButton = document.getElementById('host-reset')
resetButton.addEventListener('click', resetQuiz)
const startButton = document.getElementById('host-start')
startButton.addEventListener('click', startQuiz)


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
    timer();
}

async function startQuiz() {
    await fetch('/host/start');
    timer();
}

async function resetQuiz() {
    fetch('/host/reset');
    start();
}

// question and progress functions
async function getQuestions() {
    const res = await (fetch(`/api/allQuestions`));
    questions = await res.json();
    maxQuestions = questions.length;
}
async function hostNextQuestion() {
    const nextQuestion = await (fetch('/host/goNextQuestion'));
    currentQuestion = await nextQuestion.json();
    hostSetQuestion();
    setProgressBar();
    timer();
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
    progressText.innerText = `Question: ${currentQuestion+1} / ${maxQuestions}`
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

function timer() {
    if (!!window.EventSource) {
        var source = new EventSource('/getCount')

        source.addEventListener('message', function (e) {
            document.querySelector('#timer-text').innerHTML = e.data
        }, false)

        // source.addEventListener('open', function (e) {
            // document.querySelector('#state').innerHTML = "Connected"
        // }, false)
        // source.addEventListener('close')

        source.addEventListener('error', function (e) {
            const id_state = document.querySelector('#state')

            if (e.eventPhase == EventSource.CLOSED)
                source.close()
            // if (e.target.readyState == EventSource.CLOSED) {
                // id_state.innerHTML = "Disconnected"
            // }
            // else if (e.target.readyState == EventSource.CONNECTING) {
                // id_state.innerHTML = "Connecting..."
            // }
        }, false)
    } else {
        console.log("Your browser doesn't support SSE")
    }
}
