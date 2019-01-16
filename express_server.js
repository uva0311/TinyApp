const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.set("view engine", "ejs");

let urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};


function generateRandomString() {
  const char = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let randomString = "";

  for(let i = 0; i < 6; i++){
    randomString += char.charAt(Math.floor(Math.random() * char.length));
  }

  return randomString;
}

app.post("/login", (req, res) =>{
  res.cookie("username", req.body.username);
  res.redirect("/urls");
});

app.post("/logout", (req, res) =>{
  res.clearCookie("username", req.params.username);
  res.redirect("/urls");
});

app.get("/", (req, res) => {
  res.send("hello!");
});

app.get("/urls", (req, res) => {
  let templateVars = {
      urls: urlDatabase,
      username: req.cookies["username"]
  };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.send(`<html><a href="http://localhost:8080/u/${shortURL}">http://localhost:8080/u/${shortURL}</a></html>`);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

app.get("/urls/:id", (req, res) => {
  let templateVars = {shortURL: req.params.id}
  res.render("urls_show", templateVars);
});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect("/urls");
})

app.post("/urls/:id/delete", (req, res) => {
  const deletedUrl = req.params.id;
  delete urlDatabase[deletedUrl];
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`)
});