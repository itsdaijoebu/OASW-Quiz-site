const express = require('express');
const bodyParser = require('body-parser');
const mongodb = require('mongodb')
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();

const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');

//middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

//environmental vars
let connectionString = process.env.MONGO_URI;

MongoClient.connect(connectionString, { useUnifiedTopology: true })
    .then(client => {
        console.log('connected to db');
        const db = client.db('antiasian_racism');
        let questions = db.collection('questions');
        let settings = db.collection('settings');
        let dbQuestions = questions.find().toArray();
        let dbSettings = settings.find().toArray();
        let currentQuestion = 0;
        let maxQuestions = 0;
        let maxTime = 0;
        getMaxTime();

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
            res.sendFile('results.ejs')
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

        app.get('/host', function (req, res) {
            res.render('hostControls.ejs', {})
        })
        app.get('/host/goNextQuestion', function (req, res) {
            countdown(res, maxTime);
            // currentQuestion++;
            res.json(++currentQuestion);
        })
        app.get('/host/reset', function (req, res) {
            currentQuestion = 0;
            res.json(currentQuestion);
        })
        app.get('/host/start', function (req, res) {
            countdown(res, maxTime);
            res.json(currentQuestion)
        })

        //timer
        app.get('/getCount', function (req, res) {
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            })
            getCount(res)
        })
        app.get('/countdown', function (req, res) {
            countdown(res, maxTime);
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
                })
        }

        let currentCount = 0;
        function countdown(res, count) {
            currentCount = count;
            console.log(currentCount);
            if (count) {
                setTimeout(() => countdown(res, count - 1), 1000)
            } 
        }
        function getCount(res) {
            res.write("data: " + currentCount + "\n\n");
            if(currentCount) {
                setTimeout(() => getCount(res), 500)
            } else {
                res.end();
            }
        }
    })
    .catch(error => console.error(error));

app.listen(process.env.PORT || PORT, function () {
    console.log(`listening on ${PORT}`);
})