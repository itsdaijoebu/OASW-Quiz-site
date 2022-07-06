const express = require('express');
const bodyParser = require('body-parser');
const mongodb = require('mongodb')
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();

const app = express();
const PORT = 8000;

// app.set('view engine', 'ejs');

//middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

//environmental vars
let connectionString = process.env.MONGO_URI;

MongoClient.connect(connectionString, { useUnifiedTopology: true })
    .then(client => {
        console.log('connected to db');
        const db = client.db('tarot-cards');
        const cards = db.collection('cards');

        app.get('/', function (req, res) {
            res.sendFile(__dirname + '/index.html');
        })
        app.get('/edit-cards', function (req, res) {
            db.collection('cards').find().toArray()
            .then(results => {
                res.render('edit-cards.ejs', {cards: results})
            })
            .catch(error => console.error(error))
        })
        app.get('/api', function (req, res) {
            db.collection('cards').find().toArray()
            .then(result => {
                res.json(result)
            })
            .catch(error=> console.error(error))
        })
        app.get('/api/random-card', function (req, res) {
            db.collection('cards').find().toArray()
            .then(result => {
                let rand = Math.floor(Math.random() * result.length);
                let card = result[rand]
                res.json(card)
            })
        })

        app.post('/edit-cards', (req, res) => {
            cards.insertOne(req.body)
                .then(result => {
                    res.redirect('/edit-cards')
                })
                .catch(error => console.error(error));
        })
        
        app.put('/edit-cards', (req, res) => {
            console.log(req.body)
        })

        app.delete('/edit-cards', (req, res) => {
            cards.deleteOne(
                { _id: new mongodb.ObjectId(req.body._id) }
            )
            .then(result => {
                console.log(`ObjectId("${req.body._id}")`)
                res.json(`Deleted card id ${req.body._id}`)
            })
            .catch(error => console.error(error))
        })
        

        app.listen(process.env.PORT || PORT, function () {
            console.log(`listening...`);
        })
    })
    .catch(error => console.error(error));