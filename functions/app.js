const serverless = require("serverless-http");
const express = require("express");
const bodyParser = require("body-parser");
const { dialogflow } = require("actions-on-google");
const api = require("./gdl/api");

const app = dialogflow({
  debug: process.env.GDL_ENVIRONMENT === "dev"
});

const server = express();
server.set("port", process.env.PORT || 3000);
server.use(bodyParser.json({ type: "application/json" }));

// Initial intent
app.intent("start_app", api.start);

// Intent for stop reading and leave the assistant
app.intent("quit_app", api.quit);

// Intent to list books that matches a given topic, e.g 'cat', 'friend' and so on.
app.intent("list_books", api.listBooks);

// Intent for reading a book from topic or title
app.intent("read_book", api.readBook);

// Intent to loop on "next" for reading chapter after chapter in a book
app.intent("read_next", api.readNext);

/**
 * Default intents for welcome and fallback
 */
app.intent("Default Welcome Intent", conv => {
  conv.ask("Welcome to GDL.");
});

app.intent("Default Fallback Intent", conv => {
  conv.ask(
    "Sorry, could not understand that. Could you try again or rephrase that?"
  );
});

server.post("/", app);

module.exports.handler = serverless(server);
