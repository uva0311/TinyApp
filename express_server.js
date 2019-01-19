require('dotenv').config()

const express = require("express");
const methodOverride = require('method-override');
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const app = express();
const PORT = 8080;

app.use(methodOverride('_method'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  secret: process.env.secret_keys
}));

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
    password: bcrypt.hashSync("purple-monkey-dinosaur", 10),
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("dishwasher-funk", 10)
  }
};

function generateRandomString() {
  const char = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let randomString = "";

  for(let stringLength = 0; stringLength < 6; stringLength++){
    randomString += char.charAt(Math.floor(Math.random() * char.length));
  }

  return randomString;
};

function validateLoginCredentials(email, password){
  if(!(email.length) || !(password.length)){
      return false;
  }
  return true;
};

app.get("/register", (req, res) => {
  res.render("urls_register");
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const hasValidCredentials = validateLoginCredentials(email, password);
  const findEmail = Object.values(users).map(
    (user) => user.email).find(
    (useremail) => useremail === email);

  if(!hasValidCredentials){
      res.status(403).send('invalid email address or password.');
  } else if(findEmail){
      res.status(400).send('email address is already registered.');
      return;
  } else {
      const id = generateRandomString();
        users[id] = {
        id: id,
        email: email,
        password: bcrypt.hashSync(password, 10)
      };
      urlDatabase[id] = {};
      req.session.user_id = id;
      res.redirect("/urls");
  }
});

app.get("/login", (req, res) => {
  res.render("urls_login");
});

app.post("/login", (req, res) =>{
  const email = req.body.email;
  const password = req.body.password;
  const userInfo = Object.values(users);
  const hasValidCredentials = validateLoginCredentials(email, password);

  if(!hasValidCredentials){
    res.status(403).send("Please enter login information to login.");
  } else {
    for(let user in userInfo){
      if(userInfo[user].email === email){
        if(!bcrypt.compareSync(password, userInfo[user].password)){
            res.status(403).send("password does not match.");
            return;
        } else {
            user_id = userInfo[user].id;
            req.session.user_id = user_id;
            res.redirect("/urls");
            return;
        }
      }
    }
    res.status(403).send("email address is not registered yet.");
  }
});

app.post("/logout", (req, res) =>{
  req.session = null;
  res.redirect("/urls");
});

app.get("/", (req, res) => {
  if(!req.session.user_id){
    res.redirect("/login");
  }
  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
  const templateVars = {
      urls: urlDatabase,
      user_id: req.session.user_id
  };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  if(!req.session.user_id){
    res.status(403).send("Only registered user can visit this page.");
  } else {
    const shortURL = generateRandomString();
    urlDatabase[req.session.user_id][shortURL] = req.body.longURL;
    const templateVars = {
        urls: urlDatabase,
        user_id: req.session.user_id
    };
    res.render("urls_index", templateVars);
  }
});

app.get("/urls/new", (req, res) => {
  if(!req.session.user_id){
    res.redirect("/urls");
  }
  res.render("urls_new");
});

app.get("/u/:id", (req, res) => {
  let longURL = "";
  // missing req.params.id
  console.log(urlDatabase[req.session.user_id]);
  for (let user in urlDatabase) {
    if (req.params.id in urlDatabase[req.session.user_id]) {
      longURL = urlDatabase[user][req.params.id];
      res.redirect(longURL);
    } else {
      res.status(404).send('Short URL does not exist');
    }
  }
});

app.get("/urls/:id", (req, res) => {
  if(!req.session.user_id){
    res.status(403).send("Only registered user can visit this page.");
  } else if(!req.params.id in urlDatabase[req.session.user_id]){
    res.status(403).send("This link belongs to another user.");
  } else {
    const templateVars = {
      shortURL: req.params.id,
      longURL: urlDatabase[req.session.user_id][req.params.id]
    };
    res.render("urls_show", templateVars);
  }
});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.session.user_id][req.params.id] = req.body.longURL;
  res.redirect("/urls");
})

app.delete("/urls/:id", (req, res) => {
  const deletedUrl = req.params.id;
  delete urlDatabase[req.session.user_id][deletedUrl];
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`)
});