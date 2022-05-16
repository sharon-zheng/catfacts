const fetch = require("cross-fetch");
const http = require("http");
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const path = require("path");
let portNumber = process.env.PORT || 5001

require("dotenv").config({ path: path.resolve(__dirname, 'credentials/.env') })  

const userName = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;

const databaseAndCollection = {db: "projectDB", collection:"catFacts"};

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${userName}:${password}@cluster0.oh7no.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");

app.use(express.static('templates'));

app.get("/", (request, response) => { 
    response.render("index");
}); 

app.get("/getCatFacts", (request, response) => { 
    response.render("getCatFacts");
}); 

app.use(bodyParser.urlencoded({extended:false}));

app.post("/processCatFacts", (request, response) => { 
    let catFact = "";
    let numOfFacts = request.body.numOfFacts;
    
    fetch(`https://catfact.ninja/facts?limit=${numOfFacts}`)
        .then(response => response.json())
        .then(json => processObject(json))
        .catch(error => console.log("Reporting error: " + error));
    
    function processObject(json) {
        let count = 1;
        json.data.forEach(entry => catFact += count++ +". " + entry.fact + "<br><br>");
        response.render("processCatFacts", {catFact: catFact});
    } 
    
    async function insert() {
        try {
            await client.connect();
            let catFacts = {facts: catFact, numOfFacts: numOfFacts};
            await insertCatFact(client, databaseAndCollection, catFacts);
        } catch (e) {
            console.error(e);
        } finally {
            await client.close();
        }
    };
    
    insert();
}); 

app.get("/getCatBreeds", (request, response) => { 
    response.render("getCatBreeds");
}); 

app.post("/processCatBreeds", (request, response) => { 
    let catBreed = "";
    let numOfBreeds = request.body.numOfBreeds;
    
    fetch(`https://catfact.ninja/breeds?limit=${numOfBreeds}`)
        .then(response => response.json())
        .then(json => processObject(json))
        .catch(error => console.log("Reporting error: " + error));
    
    function processObject(json) {
        let catBreed = "";
        let count = 1;
        json.data.forEach(entry => catBreed += count++ +". " +                   "<br>breed: " + entry.breed + 
                          "<br>country: " + entry.country + 
                          "<br>origin: " + entry.origin +
                          "<br>coat: " + entry.coat +           "<br>pattern: " + entry.pattern +
                          "<br><br>");
        response.render("processCatBreeds", {catBreed: catBreed});
    } 
    
}); 

app.get("/catFactsHistory", (request, response) => {
    
    async function displayHistory() {
        let historyTableString = "<Table border='1'><tr><th># of Facts</th><th>Cat Facts</th></tr>";
        let historyList = await listCatFact();

        historyList.forEach(function(history) {
                historyTableString += "<tr><td>" + history.numOfFacts + "</td><td>" + history.facts + "</td></tr>";
        });
                        
        let variables = {
            history: historyTableString += "</Table>"
        };
        response.render("catFactsHistory", variables);
    };
    displayHistory();
});


async function insertCatFact(client, databaseAndCollection, newFact){
    const result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(newFact);
}

async function listCatFact() {
    try {
        await client.connect();
        let filter = {};
        const cursor = client.db(databaseAndCollection.db)
        .collection(databaseAndCollection.collection)
        .find(filter);
        const result = await cursor.toArray();
        return result;
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

process.stdin.setEncoding("utf8");

console.log(`Web server started and running at http://localhost:${portNumber}`);
http.createServer(app).listen(portNumber);

let prompt = "Stop to shutdown the server: ";
process.stdout.write(prompt);
process.stdin.on('readable', function() {
    let dataInput = process.stdin.read();
    if (dataInput !== null) {
		let command = dataInput.trim();
		if (command === "stop") {
            console.log("Shutting down the server");
            process.exit(0);
        } 
        process.stdout.write(prompt);
        process.stdin.resume();
    }
})