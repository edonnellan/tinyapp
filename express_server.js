const { urlencoded } = require("express");
const express = require("express");
const app = express();
const PORT = 8080; //default port 8080
const cookieParser = require("cookie-parser");

//Setting ejs engine with view folder
app.set("view engine", "ejs");

//Middleware
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

//Database objects
const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "sally@hmail.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "bob@hmail.com",
    password: "dishwasher-funk",
  },
};

const generateRandomString = () => {
  return Math.random().toString(36).slice(7);
};

//Main /urls page. URL list
app.get("/urls", (req, res) => {
  const templateVars = { 
    urls: urlDatabase,
    username: req.cookies["username"]
  };
  res.render("urls_index", templateVars);
});

//Creates the tinyURL
app.post("/urls", (req, res) => {
  const tinyUrl = generateRandomString();
  urlDatabase[tinyUrl] = req.body.longURL;
  console.log(`A TinyUrl for ${urlDatabase[tinyUrl]} been created!`);
  res.redirect(`/urls/${tinyUrl}`);
});

//Renders urls/new page when a new tinyURL has been created
app.get("/urls/new", (req, res) => {
  const templateVars = {
    username: req.cookies["username"],
  };
  console.log("templateVars: ",templateVars);
  res.render("urls_new", templateVars);
});

//TinyURL at work -- Redirects TinyURL to the OG longURL
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

//Renders page post tinyURL conversion
app.get("/urls/:id", (req, res) => {
  const templateVars = {
    username: req.cookies["username"],
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
  };
  res.render("urls_show", templateVars);
});

//Home page
app.get("/", (req, res) => {
  res.send("Hello!");
});

//Hello World page
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// /urls.json displays url database
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//Renders register page
app.get("/register", (req, res) => {
  res.render("urls_register");
});

//When a user registers --- They get a unique ID and their details are stored in the users DB
app.post("/register", (req, res) => {
  const generateUserId = generateRandomString();
  users[generateUserId] = {
    id: generateUserId,
    email: req.body.email,
    password: req.body.password
  };
  res.cookie("userId", generateUserId);
  console.log("generateID: ", generateUserId, "userDatabase: ", users);
  res.redirect("/urls");
});

//Logins
app.post("/login", (req, res) => {
  res.cookie("username", req.body.username);
  res.redirect("/urls");
});

//Logouts
app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/urls");
});

//Edit the longURL of an existing TinyURL conversion
app.post("/urls/:id", (req, res) => {
  console.log(`Updated LongURL: ${req.body.longURL}`)
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect("/urls");
});

//Delete a URL
app.post("/urls/:id/delete", (req, res) => {
  console.log(`The tinyUrl for ${urlDatabase[req.params.id]} has been deleted!`);
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

//Server listening
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
