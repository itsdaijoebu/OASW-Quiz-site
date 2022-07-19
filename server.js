if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const PORT = process.env.PORT || 3000;

const http = require("http")
const express = require('express');
const app = express();
const bodyParser = require('body-parser');

const mongodb = require('mongodb')
const MongoClient = require('mongodb').MongoClient;

const server = http.createServer(app);
const socketio = require("socket.io");
const io = socketio(server);

app.set('view engine', 'ejs');

// //middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));


// //environmental vars
let connectionString = process.env.MONGO_URI;

MongoClient.connect(connectionString, { useUnifiedTopology: true })
    .then(client => {
        console.log('connected to db');
        const db = client.db('example_quiz');
        let questions = db.collection('questions');
        let answers = db.collection('answers');
        let settings = db.collection('settings');
        let dbQuestions = questions.find().sort({ number: 1 }).toArray();
        let dbSettings = settings.find().toArray();
        let currentQuestion = 0;
        let maxQuestions = 0;
        let maxTime;
        let currentCount;
        getMaxTime();
        // getMaxQuestions();

        app.get('/', function (req, res) {
            console.log('index');
            res.render('index.ejs');
        })
        app.get('/quiz', function (req, res) {
            console.log('quiz')
            res.render('quiz.ejs', {})
        })
        app.get('/results', function (req, res) {
            console.log('results')
            answers.find().sort({ number: 1 }).toArray()
                .then(result => {
                    console.log(result)
                    res.render('results.ejs',
                        {
                            answers: result
                        })
                })

        })
        app.get('/hostResults', function (req, res) {
            console.log('host results');
            res.render('hostResults.ejs', {})
        })
        app.get('/api/allQuestions', function (req, res) {
            dbQuestions
                .then(result => {
                    res.json(result)
                })
        })
        app.get('/api/currentQuestion', function (req, res) {
            res.json(currentQuestion);
        })
        app.get('/api/currentCount', function (req, res) {
            res.json(currentCount)
        })
        app.get('/api/currentAnswerTally', function (req, res) {
            answers.find({ question: currentQuestion })
                .toArray()
                .then(result => {
                    res.json(result)
                })
        })

        app.get('/host', function (req, res) {
            res.render('hostControls.ejs', {})
        })


        //reset calls
        app.get('/api/resetQuestions', function (req, res) {
            dbQuestions = questions.find().toArray();
        })
        app.get('/api/resetSettings', function (req, res) {
            dbSettings = settings.find().toArray();
        })
        app.get('/api/resetAll', function (req, res) {
            dbQuestions = questions.find().toArray();
            dbSettings = settings.find().toArray();
        })

        app.get('/changeMaxTime', function (req, res) {
            getMaxTime();
            res.json(maxTime);
        })

        // websocket stuff
        io.on('connect', socket => {
            console.log(`new connection : ${socket.id}`)
            socket.emit('message', `Welcome to the quiz, ${socket.id}`)
            socket.on('startCountdown', () => {
                stopCountdown();
                countdown(maxTime);
            })

            socket.on('submitAnswer', answer => submitAnswers(answer))
            //host functions
            socket.on('goNextQuestion', () => goNextQuestion())
            socket.on('goPrevQuestion', () => goPrevQuestion())
            socket.on('resetQuiz', () => resetQuiz())

            // emitting answers
            let answersChangeStream = answers.watch();
            answersChangeStream.on("change", change => {
                switch (change.operationType) {
                    case "update":
                        socket.emit("updateAnswers", change.updateDescription.updatedFields)
                        break;
                }
            })

        })

        //helper functions
        function getMaxQuestions() {
            dbQuestions
                .then((result) => {
                    maxQuestions = result.length;
                })
        }
        function getMaxTime() {
            dbSettings
                .then((result) => {
                    maxTime = result[0].time;
                    currentCount = maxTime;
                })
        }

        function goNextQuestion() {
            console.log('next question');
            currentQuestion++;
            io.emit('setQuestion', currentQuestion);
            stopCountdown();
            countdown(maxTime);
        }
        function goPrevQuestion() {
            console.log('previous question');
            io.emit('setQuestion', --currentQuestion);
            stopCountdown();
            currentCount = maxTime;
            countdown(maxTime);
        }


        //host functions
        function resetQuiz() {
            currentQuestion = 0;
            io.emit('setQuestion', currentQuestion, true);
            stopCountdown();
            currentCount = maxTime;
            createAnswerInDb(currentQuestion);
        }
        function submitAnswers(answer) {
            console.log("answer", answer);
            answers.updateOne(
                { question: currentQuestion },
                { $inc: { [answer]: 1 } }
            )
        }
        function createAnswerInDb(questionNum) {
            answers.replaceOne(
                { question: questionNum },
                { question: currentQuestion, 0: 0, 1: 0, 2: 0, 3: 0 },
                { upsert: true }
            )
        }

        let timer;
        setInterval(() => io.emit('currentCount', currentCount), 500)

        function countdown(count) {
            createAnswerInDb(currentQuestion);
            currentCount = count;
            console.log(currentCount);
            if (count) {
                timer = setTimeout(() => countdown(count - 1), 1000)
            }
        }
        function stopCountdown() {
            clearTimeout(timer);
        }
    })
    .catch(error => console.error(error));

server.listen(PORT, function () {
    console.log(`listening on ${PORT}`);
})