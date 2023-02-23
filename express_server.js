const { urlencoded } = require("express");
const express = require("express");
const app = express();
const PORT = 8080; //default port 8080
const cookieParser = require("cookie-parser");
const morgan = require("morgan");

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

console.log("urlDB: ", urlDatabase);

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

//HELPER FUNCTIONS
const generateRandomString = () => {
  return Math.random().toString(36).slice(7);
};

const findUserFromEmail = (emailAddress) => {
  for (let user in users) {
    if (users[user].email === emailAddress) {
      // console.log("users: ", users);
      return users[user];
    }
  }
  return null;
};


//Main /urls page. URL list
app.get("/urls", (req, res) => {
  const userId = req.cookies.userId;
  const templateVars = { 
    urls: urlDatabase,
    user: users[userId]
  };
  // console.log("user: ", templateVars.user);
  res.render("urls_index", templateVars);
});

//Creates the tinyURL
app.post("/urls", (req, res) => {
  const userId = req.cookies.userId;
  if (!users[userId]) {
      return res.send("<html><body>Please register and login to access the tinyURL machine!\n<b>Thank you!</b></body></html>\n");
    };
  const tinyUrl = generateRandomString();
  urlDatabase[tinyUrl] = req.body.longURL;
  console.log(`A TinyUrl for ${urlDatabase[tinyUrl]} been created!`);
  res.redirect(`/urls/${tinyUrl}`);
});

//Renders urls/new page when a new tinyURL has been created
app.get("/urls/new", (req, res) => {
  const userId = req.cookies.userId;
  const templateVars = {
    user: users[userId],
  };

  //If user is not logged in they can't make tinyURL...So they get redirected to /login.
  if (!users[userId]) {
    return res.redirect("/login");
  }
  res.render("urls_new", templateVars);
});

//TinyURL at work -- Redirects TinyURL to the OG longURL
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

//Renders page post tinyURL conversion
app.get("/urls/:id", (req, res) => {
  const userId = req.cookies.userId;

  const templateVars = {
    user: users[userId],
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
  const userId = req.cookies.userId;
  const templateVars = {
    user: users[userId]
   };
   //if user is already logged in redirect to /urls
   if (users[userId]) {
    return res.redirect("/urls");
   }
  res.render("urls_register", templateVars);
});

//When a user registers -- We check they've inputted an email & password and that the email doesn't already exist in our database before accepting.
app.post("/register", (req, res) => {
   
  //1. Checking the email or password are empty or not?
  if (!req.body.email || !req.body.password) {
    return res.status(400).send("Please provide email AND Password. It can't be blank!");
  };

  //2. Checking whether the email has been registered already or not?
  const searchUsersDatabase = findUserFromEmail(req.body.email);
  // console.log("searchUsersDatabase: ", searchUsersDatabase, "req.body.email: ", req.body.email);
  if (searchUsersDatabase) {
    return res.status(400).send("The email has already been taken. Please try it with another one!");
  };

  //3. Every condition checked. Happy Path;
  const generateUserId = generateRandomString();
  users[generateUserId] = {
    id: generateUserId,
    email: req.body.email,
    password: req.body.password
  };
  
  // console.log("userObj: ", users[generateUserId]);
  res.cookie("userId", generateUserId);
  // console.log("userDatabase: ", users);
  res.redirect("/urls");
});


//LOGIN ROUTES

//Renders /login
app.get("/login", (req, res) => {
  const userId = req.cookies.userId;
  const templateVars = {
    user: users[userId]
   }
    
   //if user is already logged in redirect to /urls
   if (users[userId]) {
    return res.redirect("/urls");
   }
  res.render("urls_login", templateVars)
});

//Login Funtionality
app.post("/login", (req, res) => {
    
  //1. Checks if the iput email exists in users database or not?
  const searchUsersDatabase = findUserFromEmail(req.body.email);
  console.log("searchUserDB:", searchUsersDatabase);
  if (searchUsersDatabase === null) {
    return res.status(403).send("Email is not registered. Please register first and then login.");
  }
  //2. Check if the existing userId's passwords matches the input password or not?
  if (searchUsersDatabase.password !== req.body.password) {
  // console.log("searchUsersDatabase.password: ", searchUsersDatabase.password, "req.body.password: ",req.body.password);
    return res.status(403).send("Passwords are not a match. Please check your password and try again.");
  }

  //3. HappyPath -- If all was well then store the usersId in the userId Cookie and redirect to /urls.
  res.cookie("userId", searchUsersDatabase.id);
  res.redirect("/urls");
});

//LOGOUT
app.post("/logout", (req, res) => {
  res.clearCookie("userId", req.cookies.userId);
  res.redirect("/login");
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
