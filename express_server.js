/*  Configurations  */
require('dotenv').config()

// required modules
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

// set template engine as express.js
app.set("view engine", "ejs");

// local url database
const urlDatabase = {
  "userRandomID": {
    "b2xVn2" : "http://www.lighthouselabs.ca"
  },
  "user2RandomID": {
    "9sm5xK" : "http://www.google.com"
  }
};

// local user profile database
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
// generate a 6 characters long random string
function generateRandomString() {
  const char = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let randomString = "";

  for(let stringLength = 0; stringLength < 6; stringLength++){
    randomString += char.charAt(Math.floor(Math.random() * char.length));
  }

  return randomString;
};

// checks email or password length, specifically for POST /login, POST /register
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
      return;
  } else if(findEmail){
      res.status(400).send('email address is already registered.');
      return;
  } else {
      // construct new id for new registered user
      const id = generateRandomString();
      // construct new user data object to user db
      users[id] = {
        id: id,
        email: email,
        password: bcrypt.hashSync(password, 10)
      };
      // new user does not have any short url created, but need a new object on urlDatabase
      // in order to store the new created short urls
      urlDatabase[id] = {};
      // create new session for the new user
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
    return;
  } else {
    // search within the user database
    for(let user in userInfo){
      // check if the input email matches the email in user profile database record
      if(userInfo[user].email === email){
        // check if the input password matches the password in user profile database record
        if(!bcrypt.compareSync(password, userInfo[user].password)){
            res.status(403).send("password does not match.");
            return;
        } else {
          // create session for existing user
            user_id = userInfo[user].id;
            req.session.user_id = user_id;
            res.redirect("/urls");
        }
      }
    }
    res.status(403).send("email address is not registered yet.");
    return;
  }
});

app.post("/logout", (req, res) =>{
  // destory session once user is logged out
  req.session = null;
  res.redirect("/urls");
});

// redirect visitors according to the cookie information,
// no cookie --> login page
// has cookie --> login user interface
app.get("/", (req, res) => {
  if(!req.session.user_id){
    res.redirect("/login");
    return;
  }
  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
  // pass in variables to template urls_index.ejs for displaying urls correctly
  const templateVars = {
      urls: urlDatabase,
      user_id: req.session.user_id
  };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  // to prevent non-registered visitors crack in to user exclusive service
  if(!req.session.user_id){
    res.status(403).send("Only registered user can visit this page.");
    return;
  } else {
    // store the new shortened and original URLs into urlDatabase
    const shortURL = generateRandomString();
    urlDatabase[req.session.user_id][shortURL] = req.body.longURL;
    // pass in variables to template urls_index.ejs for displaying urls correctly
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
    return;
  }
  res.render("urls_new");
});

app.get("/u/:id", (req, res) => {
  let longURL = "";
  // check if the shortened URL key matches with the key created by the user within url database
  if(req.params.id in urlDatabase[req.session.user_id]) {
    // assign original URL from existing data to variable once the key is valid
    longURL = urlDatabase[req.session.user_id][req.params.id];
    res.redirect(longURL);
    return;
  } else {
    res.status(404).send('Short URL does not exist');
    return;
  }
});

app.get("/urls/:id", (req, res) => {
  // to prevent non-registered visitors crack in to user exclusive service
  if(!req.session.user_id){
    res.status(403).send("Only registered user can visit this page.");
    return;
  // to keep the urls made by different users in private
  } else if(!req.params.id in urlDatabase[req.session.user_id]){
    res.status(403).send("This link belongs to another user.");
    return;
  } else {
    // pass in variables to template urls_show.ejs for displaying urls correctly
    const templateVars = {
      shortURL: req.params.id,
      longURL: urlDatabase[req.session.user_id][req.params.id]
    };
    res.render("urls_show", templateVars);
  }
});

app.post("/urls/:id", (req, res) => {
  // assign new shortened and original URLs pair to urlDatabase
  urlDatabase[req.session.user_id][req.params.id] = req.body.longURL;
  res.redirect("/urls");
})

// handles user delete unwanted shortened URLs requests
app.delete("/urls/:id", (req, res) => {
  const deletedUrl = req.params.id;
  delete urlDatabase[req.session.user_id][deletedUrl];
  res.redirect("/urls");
});

// ensure the application is connected with local server when running
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`)
});