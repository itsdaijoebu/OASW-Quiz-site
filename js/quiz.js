const question = document.getElementById(`question`);
const choices = Array.from(document.getElementsByClassName(`choice-text`));
const progressText = document.getElementById('progressText');
const scoreText = document.getElementById('scoreText');
const progressBarFull = document.getElementById('progress-bar-full');


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

let questions=[]

fetch("questions.json").then(res=>{
    return res.json();
}).then(loadedQuestions => {
    console.log(loadedQuestions);
    questions = loadedQuestions;
    maxQuestions = questions.length;
    startGame();
}).catch(err => {
    console.error(err);
})



startGame = () => {
    console.log("started")
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

    progressText.innerText = `Question: ${questionCounter+1}/${maxQuestions}`;
    progressBarFull.style.width = `${(questionCounter+1)/maxQuestions * 100}%`;

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
};

choices.forEach(choice => {
    choice.addEventListener('click', e => {
        if (!acceptingAnswers) return

        acceptingAnswers = false;
        const selectedChoice = e.target;
        const selectedAnswer = selectedChoice.dataset["number"];
        let classToApply = (selectedAnswer == currentQuestion.answer) ? 'correct' : 'incorrect';

        if(classToApply === 'correct') {
            incrementScore(CORRECT_POINTS);
        } 

        selectedChoice.classList.add(classToApply);

        setTimeout( () => {
            selectedChoice.classList.remove(classToApply);
            getNewQuestion()
        }, 1000);

    })
})

incrementScore = num => {
    score += num;
    scoreText.innerText = score;
}

// startGame();