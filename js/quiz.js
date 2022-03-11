const question = document.getElementById(`question`);
const choices = Array.from(document.getElementsByClassName(`choice-text`));
const scoreText = document.getElementById('score-text');
const progressText = document.getElementById('progress-text');
const progressBar = document.getElementById('progress-bar')
const progressBarFull = document.getElementById('progress-bar-full');
const timerText = document.getElementById('timer-text')

const CORRECT_POINTS = 1;   //points given on correct answer
let maxQuestions;    // questions user answers before finishing quiz
let currentQuestion = {};
let acceptingAnswers = true;
let score = 0;
let questionCounter = 0;
let availableQuestions = {};

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
    questionCounter = 0;
    score = 0;
    availableQuestions = { ...questions };
    getNewQuestion();
};


getNewQuestion = () => {
    if (questionCounter >= questions.length) {
        localStorage.setItem('mostRecentScore', score);
        // go to end page
        return window.location.assign("/results.html");
    }

    progressText.innerText = `Question: ${questionCounter + 1}/${maxQuestions}`;
    progressBarFull.style.width = `${(questionCounter + 1) / maxQuestions * 100}%`;

    // //if random question
    // if(availableQuestions.length === 0 || questionCounter >= MAX_QUESTIONS) {
    //     return window.location.assign("/end.html");
    // }

    // const questionIndex = Math.floor(Math.random() = availableQuestions.length);
    // currentQuestion = availableQuestions[questionIndex];

    //if questions go from recommendation 1-16
    currentQuestion = availableQuestions[questionCounter];
    question.innerText = currentQuestion.question;
    questionCounter++;

    choices.forEach(choice => {
        const number = choice.dataset['number'];
        choice.innerText = currentQuestion['choice' + number];
    });

    // //if random questions
    // availableQuestions.splice(questionIndex, 1);

    acceptingAnswers = true;

    countdown(45000);
};

choices.forEach(choice => {
    choice.addEventListener('click', e => {
        if (!acceptingAnswers) return

        const selectedChoice = e.target;
        const selectedAnswer = selectedChoice.dataset["number"];
        let classToApply = (selectedAnswer == currentQuestion.answer) ? 'correct' : 'incorrect';

        if (classToApply === 'correct') {
            incrementScore(CORRECT_POINTS);
        }

        selectedChoice.classList.add(classToApply);

        // setTimeout(() => {
        //     resetChoices();
        // }, 1000);
        // resetChoices();
        answered();

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
        console.log("timed out");
        answered();
        // resetChoices();
        return;
    } else {
        console.error("the timer isn't equal to, above, or below 0")
    }

    console.log(timer)



    expected += interval;
    setTimeout(step, Math.max(0, interval - dt)); // take into account drift
}

function answered() {
    acceptingAnswers = false;

    choices.forEach(choice => {
        choice.classList.add("inactive")
    })

    resetChoices();
}

function resetChoices() {
    setTimeout(() => {
        choices.forEach(choice => {
            choice.classList.remove("inactive");
            choice.classList.remove("correct");
            choice.classList.remove("incorrect");
        })
        getNewQuestion();
    }, 1000);

}