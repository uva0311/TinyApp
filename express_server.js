const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const hash = (plaintext) => {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(plaintext, salt);
};

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.set("view engine", "ejs");

const urlDatabase = {
  "userRandomID": {
    "b2xVn2" : "http://www.lighthouselabs.ca"
  },
  "user2RandomID": {
    "9sm5xK" : "http://www.google.com"
  }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("1", 10),
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("2", 10)
  }
};

function generateRandomString() {
  const char = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let randomString = "";

  for(let i = 0; i < 6; i++){
    randomString += char.charAt(Math.floor(Math.random() * char.length));
  }

  return randomString;
}

app.get("/register", (req, res) => {
  res.render("urls_register");
});

app.post("/register", (req, res) => {
  if(!(req.body.email.length) || !(req.body.password.length)){
    res.status(400).send('invalid email address or password.');
  } else if(Object.values(users).find((user) => user.email === req.body.email? true : false)) {
    res.status(400).send('email address is already registered.');
  } else {
    const id = generateRandomString();
    users[id] = {
      id: id,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10)
    };
    urlDatabase[id] = {};
    res.cookie("user_id", id);
    res.redirect("/urls");
  }
});

app.get("/login", (req, res) => {
  res.render("urls_login");
});

app.post("/login", (req, res) =>{
  password = req.body.password;
  if(!(req.body.email.length) || !(req.body.password.length)){
    res.status(403).send('Please enter login information to login.');
  } else {
    for(let i = 0; i < Object.values(users).length; i++){
      if(Object.values(users)[i].email === req.body.email){
        if(!bcrypt.compareSync(req.body.password, Object.values(users)[i].password)){
            res.status(403).send('password does not match.');
            return;
        } else {
            user_id = Object.values(users)[i].id;
            res.cookie("user_id", user_id);
            res.redirect("/urls");
            return;
        }
      }
    }
    res.status(403).send('email address is not registered yet.');
  }
});

app.post("/logout", (req, res) =>{
  res.clearCookie("user_id", req.params.user_id);
  res.redirect("/urls");
});

app.get("/", (req, res) => {
  res.send("hello!");
});

app.get("/urls", (req, res) => {
  let templateVars = {
      urls: urlDatabase,
      user_id: req.cookies["user_id"]
  };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[req.cookies["user_id"]][shortURL] = req.body.longURL;
  res.send(`<html><a href="http://localhost:8080/u/${shortURL}">http://localhost:8080/u/${shortURL}</a></html>`);
});

app.get("/urls/new", (req, res) => {
  if(!req.cookies["user_id"]){
    res.redirect("/urls");
  }
  res.render("urls_new");
});

app.get("/u/:id", (req, res) => {
  let longURL = "";

  for (let user in urlDatabase) {
    if (req.params.id in urlDatabase[user]) {
      longURL = urlDatabase[user][req.params.id];
      res.redirect(longURL);
    }
  }
});

app.get("/urls/:id", (req, res) => {
  let templateVars = { shortURL: req.params.id, longURL: urlDatabase[req.cookies["user_id"]][req.params.id]};
  res.render("urls_show", templateVars);
});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.cookies["user_id"]][req.params.id] = req.body.longURL;
  res.redirect("/urls");
})

app.post("/urls/:id/delete", (req, res) => {
  const deletedUrl = req.params.id;
  delete urlDatabase[req.cookies["user_id"]][deletedUrl];
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`)
});