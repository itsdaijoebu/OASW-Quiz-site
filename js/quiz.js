const question = document.getElementById(`question`);
const choices = Array.from(document.getElementsByClassName(`choice-text`));
const choiceContainers = Array.from(document.querySelectorAll(`.choice-container`));
const scoreText = document.getElementById('score-text');
const progressText = document.getElementById('progress-text');
const progressBar = document.getElementById('progress-bar')
const progressBarFull = document.getElementById('progress-bar-full');
const timerText = document.getElementById('timer-text')
let timePerQuestion = 20000;

const CORRECT_POINTS = 1;   //points given on correct answer
let maxQuestions;    // questions user answers before finishing quiz
let currentQuestion = {};
let acceptingAnswers = true;
let score = 0;
// let questionNumber = 0;
let availableQuestions = {};
let selectedChoice = null;    //holds the selected answer while user can still choose

// google sheets and whether or not to continue
// const output = document.getElementById("output")
let SETTINGS_URL = "https://docs.google.com/spreadsheets/d/1P16bFHWQ-0_e7AZKztlNoHUMqJR08hKDKC3i4Lwq0ac/gviz/tq?"
let doContinue = false;
let questionNumber = 0;

// google sheets for quiz answers
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxavy0ZWtn9VMOPJ_I6KJAvW86KQkwZj6Shnf9OaJPrzSh2JmlKteR2FMQgSDSirXyANw/exec'
const ANSWERS_URL = 'https://docs.google.com/spreadsheets/d/1gI9p2ZQQdmxbcOr-VFgLu-5r8ZrycA9mNJwve5pIvQ4/gviz/tq?'
const form = document.forms['question-choices']
const questionRadio = document.querySelector("#question-for-google")
questionRadio.checked = true;
let [answeredA, answeredB, answeredC, answeredD] = [0, 0, 0, 0];  //logs the answers from the sheet

const visualizerSection = document.querySelector("#visualizer-section")

const visualizerTextA = document.querySelector("#visualizer-text-a")
const visualizerTextB = document.querySelector("#visualizer-text-b")
const visualizerTextC = document.querySelector("#visualizer-text-c")
const visualizerTextD = document.querySelector("#visualizer-text-d")

const visualizerFullA = document.querySelector("#visualizer-a-full") 
const visualizerFullB = document.querySelector("#visualizer-b-full")
const visualizerFullC = document.querySelector("#visualizer-c-full")
const visualizerFullD = document.querySelector("#visualizer-d-full")

const loader = document.querySelector("#loader")
const mainSection = document.querySelector("#main-section")

window.onload = doneLoading();

function doneLoading() {
    mainSection.classList.remove('invisible')
    loader.classList.add('displayless')
    console.log("done loading")
}



// let questions = [
//     {
//         question: `Provide community education on _______`,
//         choice1: `the origin and nature of the pandemic`,
//         choice2: `the origin and nature of the China flu`,
//         choice3: `how to achieve herd immunity`,
//         choice4: `how to minimize the pandemic's mortality rate`,
//         answer: 1
//     },
//     {
//         question: `According to the recommendations, what should we help the community address?`,
//         choice1: `Their waning food supplies`,
//         choice2: `The impacts of social media on mental health`,
//         choice3: `Their fear and stigma about Asians during Covid-19`,
//         choice4: `B and C`,
//         answer: 3
//     },
//     {
//         question: `What should be challenged?`,
//         choice1: `Oppressive information about the pandemic you hear about from friends and family members`,
//         choice2: `All information about the pandemic that contradicts whatever has recently been posted on Facebook`,
//         choice3: `All information about the pandemic, regardless of where it comes from`,
//         choice4: `False and/or oppressive information about the pandemic, especially coming from public and authority figures`,
//         answer: 4
//     }
// ];

fetchSettingsGSheets();

let questions = []

fetch("questions.json").then(res => {
    return res.json();
}).then(loadedQuestions => {
    // console.log(loadedQuestions);
    questions = loadedQuestions;
    maxQuestions = questions.length;
    startGame();
}).catch(err => {
    console.error(err);
})

startGame = () => {
    // console.log("started")
    visualizerSection.classList.add('invisible');
    score = 0;
    availableQuestions = { ...questions };
    getNewQuestion();
};


getNewQuestion = () => {
    visualizerSection.classList.add('invisible');

    if (questionNumber >= questions.length) {
        localStorage.setItem('mostRecentScore', score);
        // go to end page
        return window.location.assign("/end.html");
    }

    questionRadio.value = questionNumber + 1;
    [answeredA, answeredB, answeredC, answeredD] = [0, 0, 0, 0];
    
    progressText.innerText = `Question: ${questionNumber + 1}/${maxQuestions}`;
    progressBarFull.style.width = `${(questionNumber + 1) / maxQuestions * 100}%`;

    // //if random question
    // if(availableQuestions.length === 0 || questionCounter >= MAX_QUESTIONS) {
    //     return window.location.assign("/end.html");
    // }

    // const questionIndex = Math.floor(Math.random() = availableQuestions.length);
    // currentQuestion = availableQuestions[questionIndex];

    //if questions go from recommendation 1-16
    currentQuestion = availableQuestions[questionNumber];
    question.innerText = currentQuestion.question;
    // questionCounter++;

    choices.forEach(choice => {
        const number = choice.dataset['number'];
        choice.innerText = currentQuestion['choice' + number];
    });

    // //if random questions
    // availableQuestions.splice(questionIndex, 1);

    selectedChoice = null;
    acceptingAnswers = true;

    countdown(timePerQuestion);
};

// choices.forEach(choice => {
//     choice.addEventListener('click', e => {
//         if (!acceptingAnswers) return
//         answerSelected(e);
//     })
// })
choiceContainers.forEach(container => {
    container.addEventListener('click', () => {
        if (!acceptingAnswers) return;
        let el = container.querySelector('.choice-text');
        answerSelected(el);
    })
})

incrementScore = num => {
    score += num;
    scoreText.innerText = score;
}

//Countdown timer
let interval = 100; // ms
let expected = Date.now() + interval;
let rawTimer;
let timer;
let targetTime;
function countdown(rawMaxTime) {
    clearTimeout(step);
    targetTime = Date.now() + rawMaxTime;

    setTimeout(step, interval);

}

function step() {
    let dt = Date.now() - expected; // the drift (positive for overshooting)
    // if (dt > interval) {
    //     // something really bad happened. Maybe the browser (tab) was inactive?
    //     // possibly special handling to avoid futile "catch up" run
    //     console.error('something happened with the timer')
    // }
    rawTimer = targetTime - Date.now();
    timer = rawTimer / 1000;

    if (rawTimer >= 0 && rawTimer >= 1000) {
        timer = Math.round(timer)
        timerText.innerText = timer;
    } else if (rawTimer >= 0 && rawTimer < 1000) {

        timerText.innerText = timer.toFixed(2);
    }
    else if (timer < 0) {
        clearTimeout(step);
        timerText.innerText = 0;
        // console.log("timed out");
        // answered();
        // resetChoices();
        revealAnswers();
        pollSettingsGSheets();
        
        return;
    } else {
        console.error("the timer isn't equal to, above, or below 0")
    }

    // console.log(timer)

    expected += interval;
    setTimeout(step, Math.max(0, interval - dt)); // take into account drift
}

function answerSelected(e = -1) {
    choices.forEach(choice => {
        choice.parentElement.classList.remove('selected')
    })
    selectedChoice = e;
    selectedChoice.parentElement.classList.add('selected')
}

function revealAnswers() {
    visualizerSection.classList.remove('invisible');

    let classToApply = ' '

    submitQuiz();

    if (selectedChoice) {
        let selectedAnswer = selectedChoice.dataset["number"];
        classToApply = (selectedAnswer == currentQuestion.answer) ? 'correct' : 'incorrect';
        selectedChoice.classList.add(classToApply);
    }

    if (classToApply === 'correct') {
        incrementScore(CORRECT_POINTS);
    }

    acceptingAnswers = false;


    choices.forEach(choice => {
        choice.classList.add("inactive");
        let choiceIndex = choice.dataset["number"];
        if (choiceIndex == currentQuestion.answer) choice.classList.add('correctTag')
    })

    // // setTimeout(() => {
    // //     resetChoices();
    // // }, 1000);
    // // resetChoices();
    // answered();
}


function resetChoices() {
    // setTimeout(() => {
    //     choices.forEach(choice => {
    //         choice.classList.remove("inactive");
    //         choice.classList.remove("correct");
    //         choice.classList.remove("incorrect");
    //     })
    //     getNewQuestion();
    // }, 1000);

    choices.forEach(choice => {
        choice.classList.remove("inactive");
        choice.classList.remove("correct");
        choice.classList.remove("incorrect");
        choice.classList.remove("selected");
        choice.classList.remove("correctTag");
    })

    doContinue = false;
    getNewQuestion();
}

function pollSettingsGSheets() {
    console.log("fetching google sheets")
    fetchQuizAnswers();
    setTimeout(() => {
        fetchQuizAnswers();
    }, 4000)
    setTimeout(() => {
        if (doContinue) return resetChoices();
        fetchSettingsGSheets();
        pollSettingsGSheets();
    }, 6000);
}

function fetchSettingsGSheets() {
    fetch(SETTINGS_URL)
        .then(res => res.text())
        .then(rep => {
            const data = JSON.parse(rep.substring(47).slice(0, -2));
            data.table.rows.forEach((main) => {
                questionNumber = main.c[0].v;
                questionNumber -= 1;
                doContinue = main.c[1].v;
                timePerQuestion = main.c[2].v;
                timePerQuestion *= 1000
                console.log(`${questionNumber}, ${doContinue}, ${timePerQuestion}`)
            })
        })
}

function fetchQuestionNumber() {
    fetch(SETTINGS_URL)
        .then(res => res.text())
        .then(rep => {
            const data = JSON.parse(rep.substring(47).slice(0, -2));
            data.table.rows.forEach((main) => {
                return main.c[0].v;
            })
        })
}

// send and retrieve answers to google sheets

form.addEventListener('submit', e => {
    e.preventDefault()
    fetch(SCRIPT_URL, { method: 'POST', body: new FormData(form) })
        .then(response => console.log('Success!', response))
        .catch(error => console.error('Error!', error.message))
})

const submitButton = document.querySelector("#submit-button");
function submitQuiz() {
    if (submitButton) {
        submitButton.click();
    }
}

function fetchQuizAnswers() {
    fetch(ANSWERS_URL)
        .then(res => res.text())
        .then(rep => {
            const data = JSON.parse(rep.substring(47).slice(0, -2));
            data.table.rows.forEach((main) => {
                if (main.c[0].v == questionRadio.value) {
                    if (main.c[1].v == 'A') answeredA++
                    else if (main.c[1].v == 'B') answeredB++
                    else if (main.c[1].v == 'C') answeredC++
                    else if (main.c[1].v == 'D') answeredD++
                    // console.log(`expected answers for q${main.c[0].v}: ${answeredA}, ${answeredB}, ${answeredC}, ${answeredD}`)
                }
                
            })
        })
        console.log('test')
            fillVisualizerBar();
}

function fillVisualizerBar() {
    let total = answeredA + answeredB + answeredC + answeredD;
    let aP = Math.floor((answeredA/total)*100);
    let bP = Math.floor((answeredB/total)*100);
    let cP = Math.floor((answeredC/total)*100);
    let dP = Math.floor((answeredD/total)*100);

    if(!aP) aP = 0;
    if(!bP) bP = 0;
    if(!cP) cP = 0;
    if(!dP) dP = 0;

    visualizerTextA.innerText = `${aP}%`;
    visualizerTextB.innerText = `${bP}%`;
    visualizerTextC.innerText = `${cP}%`;
    visualizerTextD.innerText = `${dP}%`;
    
    visualizerFullA.style.width = `${aP}%`;
    visualizerFullB.style.width = `${bP}%`;
    visualizerFullC.style.width = `${cP}%`;
    visualizerFullD.style.width = `${dP}%`;
}