const express = require("express");
const { google } = require("googleapis");
let spreadsheetId = "1gI9p2ZQQdmxbcOr-VFgLu-5r8ZrycA9mNJwve5pIvQ4";
// let spreadsheetId = "1dHp-uRLVeN5CWmZed8X8UxrsuhZIbMv_JHVJsQ6pIMA";

const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({extended: true}));

app.get("/", (req, res) => {
    res.render("quiz");
})

app.post("/", async (req, res) => {
    const {question, choicetext} = req.body;

    const auth = new google.auth.GoogleAuth({
        keyFile: "credentials.json",
        scopes: "https://www.googleapis.com/auth/spreadsheets",
    });

    //Create client instance for auth
    const client = await auth.getClient();

    //Instance of Google Sheets API
    const googleSheets = google.sheets({ version: "v4", auth: client });

    // Get metadata about spreadsheet
    const metaData = await googleSheets.spreadsheets.get({
        auth,
        spreadsheetId,
    });

    // Read rows from spreadsheet
    const getRows = await googleSheets.spreadsheets.values.get({
        auth,
        spreadsheetId,
        range: "Question1",
    })

    //Write rows from spreadsheet
    await googleSheets.spreadsheets.values.append({
        auth,
        spreadsheetId,
        range: "Question1",
        valueInputOption: "RAW",
        resource: {
            values: [
                [choicetext],
            ],
        },
    });

    res.writeHead(302, {'location': 'and-thus-we-finish.html'});
    res.end();
});

app.listen(1337, (req, res) => console.log("running on 1337"));