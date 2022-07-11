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
        let currentQuestion = 1;
        let maxTime = 5;

        app.get('/', function (req, res) {
            console.log('index');
            res.render('index.ejs');
        })
        app.get('/quiz', function (req, res) {
            console.log('quiz')
            res.render('quiz.ejs', {})
        })
        app.get('/results', function (req, res) {
            res.sendFile('results.ejs')
        })
        app.get('/api/', function (req, res) {
            db.collection('questions').find().toArray()
                .then(result => {
                    res.json(result)
                })
        })

        //timer
        app.get('/countdown', function (req, res) {
            console.log('maxTime:', maxTime)
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            })
            countdown(res, maxTime)
        })
        function countdown(res, count) {
            res.write("data: " + count + "\n\n")
            if (count) {
                setTimeout(() => countdown(res, count - 1), 1000)
            } else {
                res.end()
            }
        }

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

        app.get('/timer', function (req, res) {
            console.log('timer');
            // maxTime = dbSettings[0].time;
            dbSettings
                .then(result => {
                    console.log(result[0].time)
                })
        })
        // app.get('/edit-cards', function (req, res) {
        //     db.collection('cards').find().toArray()
        //     .then(results => {
        //         res.render('edit-cards.ejs', {cards: results})
        //     })
        //     .catch(error => console.error(error))
        // })
        // app.get('/api', function (req, res) {
        //     db.collection('cards').find().toArray()
        //     .then(result => {
        //         res.json(result)
        //     })
        //     .catch(error=> console.error(error))
        // })
        // app.get('/api/random-card', function (req, res) {
        //     db.collection('cards').find().toArray()
        //     .then(result => {
        //         let rand = Math.floor(Math.random() * result.length);
        //         let card = result[rand]
        //         res.json(card)
        //     })
        // })

        // app.post('/edit-cards', (req, res) => {
        //     cards.insertOne(req.body)
        //         .then(result => {
        //             res.redirect('/edit-cards')
        //         })
        //         .catch(error => console.error(error));
        // })

        // app.put('/edit-cards', (req, res) => {
        //     console.log(req.body)
        // })

        // app.delete('/edit-cards', (req, res) => {
        //     cards.deleteOne(
        //         { _id: new mongodb.ObjectId(req.body._id) }
        //     )
        //     .then(result => {
        //         console.log(`ObjectId("${req.body._id}")`)
        //         res.json(`Deleted card id ${req.body._id}`)
        //     })
        //     .catch(error => console.error(error))
        // })
    })
    .catch(error => console.error(error));

app.listen(process.env.PORT || PORT, function () {
    console.log(`listening on ${PORT}`);
})