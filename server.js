if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const PORT = process.env.PORT || 3000;

const http = require("http");
const express = require("express");
const app = express();
const bodyParser = require("body-parser");

const mongodb = require("mongodb");
const MongoClient = require("mongodb").MongoClient;

const server = http.createServer(app);
const socketio = require("socket.io");
const io = socketio(server);

app.set("view engine", "ejs");

// //middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));
app.use((req, res, next) => {
  if (req.path.substr(-1) === "/" && req.path.length > 1) {
    const query = req.url.slice(req.path.length);
    const safepath = req.path.slice(0, -1).replace(/\/+/g, "/");
    res.redirect(301, safepath + query);
  } else {
    next();
  }
});

// //environmental vars
let connectionString = process.env.MONGO_URI;

MongoClient.connect(connectionString, { useUnifiedTopology: true })
  .then((client) => {
    console.log("connected to db");
    const dbstring = process.env.DBSTRING;
    const db = client.db(dbstring);
    let questions = db.collection("questions");
    let answers = db.collection("answers");
    let settings = db.collection("settings");
    let dbQuestions = questions.find().sort({ number: 1 }).toArray();
    let dbSettings = settings.find().toArray();
    let sessionId = 0;
    let currentQuestion = 0;
    let maxQuestions = 0;
    let maxTime;
    let currentCount;
    getMaxTime();
    // getMaxQuestions();

    app.get("/", function (req, res) {
      console.log("index");
      res.render("index.ejs");
    });
    app.get("/quiz", function (req, res) {
      console.log("quiz");
      res.render("quiz.ejs", {});
    });
    app.get("/results", function (req, res) {
      console.log("results");
      answers
        .find()
        .sort({ number: 1 })
        .toArray()
        .then((result) => {
          console.log(result);
          res.render("results.ejs", {
            answers: result,
          });
        });
    });
    app.get("/hostResults", function (req, res) {
      console.log("host results");
      res.render("hostResults.ejs", {});
    });
    app.get("/api/allQuestions", function (req, res) {
      dbQuestions.then((result) => {
        res.json(result);
      });
    });
    app.get("/api/currentQuestion", function (req, res) {
      res.json(currentQuestion);
    });
    app.get("/api/currentCount", function (req, res) {
      res.json(currentCount);
    });
    app.get("/api/currentAnswerTally", function (req, res) {
      answers
        .find({ question: currentQuestion })
        .toArray()
        .then((result) => {
          res.json(result);
        });
    });

    app.get("/host", function (req, res) {
      res.render("hostControls.ejs", {});
    });

    //reset calls
    app.get("/api/resetQuestions", function (req, res) {
      dbQuestions = questions.find().sort({ number: 1 }).toArray();
    });
    app.get("/api/resetSettings", function (req, res) {
      dbSettings = settings.find().toArray();
    });
    app.get("/api/resetAll", function (req, res) {
      dbQuestions = questions.find().sort({ number: 1 }).toArray();
      dbSettings = settings.find().toArray();
    });

    app.get("/api/maxTime", function (req, res) {
      getMaxTime();
      res.json(maxTime);
    });
    app.get("/api/sessionId", function (req, res) {
      res.json(sessionId);
    });

    // websocket stuff
    io.on("connect", (socket) => {
      console.log(`new connection : ${socket.id}`);
      socket.emit("message", `Welcome to the quiz, ${socket.id}`);
      socket.on("startQuiz", () => {
        // socket.emit('resetScore')
        generateSession();
        stopCountdown();
        countdown(maxTime);
      });

      socket.on("submitAnswer", (answer) => submitAnswers(answer));
      //host functions
      socket.on("goNextQuestion", () => goNextQuestion());
      socket.on("goPrevQuestion", () => goPrevQuestion());
      socket.on("resetQuiz", () => resetQuiz());
      socket.on("stopTimer", () => stopCountdown());

      // emitting answers
      let answersChangeStream = answers.watch();
      answersChangeStream.on("change", (change) => {
        switch (change.operationType) {
          case "update":
            socket.emit(
              "updateAnswers",
              change.updateDescription.updatedFields
            );
            break;
        }
      });
    });

    //helper functions
    function getMaxQuestions() {
      dbQuestions.then((result) => {
        maxQuestions = result.length;
      });
    }
    function getMaxTime() {
      settings.findOne({ setting: "time" }).then((result) => {
        maxTime = result.time;
        currentCount = maxTime;
      });
    }
    function generateSession() {
      let session = Date.now();
      sessionId = session;
      settings.replaceOne(
        { setting: "sessionId" },
        {
          setting: "sessionId",
          sessionId: sessionId,
        },
        { upsert: true }
      );
      io.sockets.emit("sessionId", sessionId);
    }
    function getSessionId() {
      settings.findOne({ setting: "sessionId" }).then((result) => {
        sessionId = result.sessionId;
      });
    }

    function goNextQuestion() {
      console.log("next question");
      currentQuestion++;
      io.emit("setQuestion", currentQuestion);
      stopCountdown();
      countdown(maxTime);
    }
    function goPrevQuestion() {
      console.log("previous question");
      io.emit("setQuestion", --currentQuestion);
      stopCountdown();
      currentCount = maxTime;
      countdown(maxTime);
    }

    //host functions
    function resetQuiz() {
      generateSession();
      currentQuestion = 0;
      io.emit("setQuestion", currentQuestion, true);
      stopCountdown();
      currentCount = maxTime;
      createAnswerInDb(currentQuestion);
    }
    function submitAnswers(answer) {
      console.log("answer", answer);
      answers.updateOne(
        { question: currentQuestion },
        { $inc: { [answer]: 1 } }
      );
    }
    function createAnswerInDb(questionNum) {
      answers.replaceOne(
        { question: questionNum },
        { question: currentQuestion, 0: 0, 1: 0, 2: 0, 3: 0 },
        { upsert: false }
      );
    }

    let timer;
    setInterval(() => io.emit("currentCount", currentCount), 500);

    function countdown(count) {
      createAnswerInDb(currentQuestion);
      currentCount = count;
      console.log(currentCount);
      if (count) {
        timer = setTimeout(() => countdown(count - 1), 1000);
      }
    }
    function stopCountdown() {
      clearTimeout(timer);
      currentCount = 0;
    }
  })
  .catch((error) => console.error(error));

server.listen(PORT, function () {
  console.log(`listening on ${PORT}`);
});
