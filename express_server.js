const { findUserFromEmail } = require("./helpers");
const { urlencoded } = require("express");
const express = require("express");
const app = express();
const PORT = 8080; //default port 8080
let cookieSession = require('cookie-session');
const morgan = require("morgan");
const bcrypt = require("bcryptjs");


//Setting ejs engine with view folder
app.set("view engine", "ejs");

//// Middleware ////
app.use(express.urlencoded({ extended: false }));
app.use(morgan("dev"));
app.use(cookieSession({
  name: 'CookieSesh',
  keys: ["key1", "key2"],
}));



//// Database objects ////


const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
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



//// HELPER FUNCTIONS ////

//Generates random string -- userId and TinyURL
const generateRandomString = () => {
  return Math.random().toString(36).slice(7);
};



//Returns user object with all of their URLs conversions by using their userId
const urlsForUser = (currentUserId, databaseOfUrls) => {
  let userUrls = [];

  //Loops urlDB to 
  for (let tinyURL in databaseOfUrls) {
    const userIDsInSystem = databaseOfUrls[tinyURL].userID;
    if (currentUserId === userIDsInSystem) {
      userUrls.push({
        shortURL: tinyURL,
        longURL: databaseOfUrls[tinyURL].longURL
      });
    }
  }
  return userUrls;
};



//Checks if a specific URL belongs to a certain user
const doesTheUserOwnThisUrl = (currentUserId, paramId) => {
  //1. Getting users URLs
  const usersUrls = urlsForUser(currentUserId, urlDatabase); //returns array of users urls in objects
  //2. Checking if any of the users TinyURLs match the param.id of the url they're searching
  for (let url of usersUrls) {
    if (url.shortURL === paramId) {
      return true;
    }
  }
  return false;
};


//// ROUTES ////


//Main Page (/urls page)
app.get("/urls", (req, res) => {
  const userId = req.session.userId;

  //1. Checks if user is logged in or not?
  if (!userId) {
    return res.status(401).send("<html><body>You must register and be logged in to see the TinyURLs in all their glory!\n<a href=/login <h3>Login Here!</h3></a>\n<a href=/register <h3>Register Here!</h3></body></html>\n");
  }

  //2. Checks if this url conversion is owned by current user or not?
  if (!urlsForUser(userId, urlDatabase)) {
    return res.status(401).send("<html><body>You must register and be logged in to see the TinyURLs in all their glory!\n<a href=/login <h3>Login Here!</h3></a>\n<a href=/register <h3>Register Here!</h3></body></html>\n");
  }

  //Happy Path :) -- sends templeVars with verified user owned urls to be displayed.
  const templateVars = {
    urls: urlsForUser(userId, urlDatabase),
    user: users[userId]
  };
  res.render("urls_index", templateVars);
});



//Creates the tinyURL
app.post("/urls", (req, res) => {
  const userId = req.session.userId;

  //1. Checking if the user is logged in or not
  if (!users[userId]) {
    return res.send("<html><body>Please register and login to access the tinyURL machine!\n<b>Thank you!</b></body></html>\n");
  }

  //2. Happy Path -- Generating the TinyURL
  const tinyURL = generateRandomString();
  urlDatabase[tinyURL] = {};
  urlDatabase[tinyURL].longURL = req.body.longURL;
  urlDatabase[tinyURL].userID = userId;

  console.log(`The TinyURL for ${urlDatabase[tinyURL].longURL} has been created! TinyURL = ${tinyURL}`); //Server update for a new tinyURL
  res.redirect(`/urls/${tinyURL}`);
});



//Renders urls/new page when a new tinyURL has been created
app.get("/urls/new", (req, res) => {
  const userId = req.session.userId;
  const templateVars = {
    user: users[userId],
  };

  //If user is not logged in...They get redirected to /login.
  if (!users[userId]) {
    return res.redirect("/login");
  }
  res.render("urls_new", templateVars);
});



//TinyURL at work -- Redirects TinyURL to the OG longURL
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id].longURL;
  //if the TinyURL doesn't exist- error code & HTML prompted with message
  if (!longURL) {
    return res.status(404).send("<html><body>TinyURL not found. Maybe you could make it? Register and try!</body>\n<a href=/login <h3>Login Here!</h3></a>\n<a href=/register <h3>Register Here!</h3></body></html>\n</html>\n");
  }
  res.redirect(longURL);
});



//Renders page post tinyURL conversion
app.get("/urls/:id", (req, res) => {
  const userId = req.session.userId;
  const id = req.params.id;

  //1. Checks it user is logged in or not?
  if (!users[userId]) {
    return res.status(404).send("<html><body>Please register and login to access the tinyURLs!\n<b>Thank you!</b></body>\n<a href=/login <h3>Login Here!</h3></a>\n<a href=/register <h3>Register Here!</h3></body></html>\n");
  }

  //2. Checks if current user is the owner of a specific url conversion or not?
  if (doesTheUserOwnThisUrl(userId, id) === false) {
    return res.status(401).send("<html><body>This isn't your TinyURL. Please register and login to access your very own tinyURLs!\n<b>Thank you!</b></body>\n<a href=/login <h3>Login Here!</h3></a>\n<a href=/register <h3>Register Here!</h3></body></html>\n");
  }
    
  //3. Happy Path :) -- templateVars with user & url info to be displayed after URL conversion
  const templateVars = {
    user: users[userId],
    id: id,
    longURL: urlDatabase[id].longURL,
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
  const userId = req.session.userId;
  const templateVars = {
    user: users[userId]
  };
  //if user is already logged in redirect to /urls
  if (users[userId]) {
    return res.redirect("/urls");
  }
  //Else send user to register
  res.render("urls_register", templateVars);
});



//When a user registers -- We check they've inputted an email & password and that the email doesn't already exist in our database before accepting.
app.post("/register", (req, res) => {
   
  //1. Checking the email or password are empty or not?
  if (!req.body.email || !req.body.password) {
    return res.status(400).send("<html><body>Please provide email AND Password. It can't be blank!</body></html>");
  }

  //2. Checking whether the email has been registered already or not?
  const searchUsersDatabase = findUserFromEmail(req.body.email, users);
  if (searchUsersDatabase) {
    return res.status(400).send("<html><body>The email has already been taken. Please try it with another one!</body></html>");
  }

  //3. Every condition checked. Happy Path :) -- Add user info to users database;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  const generateUserId = generateRandomString();
  req.session.userId = generateUserId;
  users[generateUserId] = {
    id: generateUserId,
    email: req.body.email,
    password: hashedPassword
  };
  
  res.redirect("/urls");
});



//Renders /login
app.get("/login", (req, res) => {
  const userId = req.session.userId;
  const templateVars = {
    user: users[userId]
  };
    
  //if user is already logged in redirect to /urls
  if (users[userId]) {
    return res.redirect("/urls");
  }
  res.render("urls_login", templateVars);
});



//Login Funtionality
app.post("/login", (req, res) => {
    
  //1. Checks if the input email exists in users database or not?
  const searchUsersDatabase = findUserFromEmail(req.body.email, users);
  if (searchUsersDatabase === undefined) {
    return res.status(404).send("<html><body>That email address is not registered. Please register and login!</body></html>");
  }
  
  //2. Check if the existing userId's passwords matches the input password or not?
  if (!bcrypt.compareSync(req.body.password, searchUsersDatabase.password)) {
    return res.status(403).send("<html><body>Passwords are not a match. Please check your password and try again.</body></html>");
  }

  //3. HappyPath -- If all was well then store the usersId in the userId Cookie and redirect to /urls.
  req.session.userId = searchUsersDatabase.id;
  res.redirect("/urls");
});



//LOGOUT
app.post("/logout", (req, res) => {
  req.session = null; // Destroying the session
  res.redirect("/login");
});



//Edit the longURL of an existing TinyURL conversion
app.post("/urls/:id", (req, res) => {
  const userId = req.session.userId;
  const id = req.params.id;
  const userUrlObject = urlDatabase[id];
  
  //1. If TinyURL doesn't exist in database
  if (!userUrlObject) {
    return res.status(400).send("<html><body>TinyURL not found. Maybe you could make it?</body></html>\n");
  }

  //2. If user isn't logged in -- direct them to reg || login
  if (!users[userId]) {
    return res.status(404).send("<html><body>Please register and login to access the tinyURLs!\n<b>Thank you!</b></body>\n<a href=/login <h3>Login Here!</h3></a>\n<a href=/register <h3>Register Here!</h3></body></html>\n");
  }

  //3. Checks if the current user own the conversion they're searching or not?
  if (doesTheUserOwnThisUrl(userId, id) === false) {
    return res.status(401).send("<html><body>This TinyURL belongs to someone else. Why not make it yourself!\n<b>Thank you!</b></body>\n<a href=/login <h3>Login Here!</h3></a>\n<a href=/register <h3>Register Here!</h3></body></html>\n");
  }

  //4. Happy Path :) -- longURL has been updated in the database by the owner user
  console.log(`Updated LongURL: ${req.body.longURL}`); // Server update about an updated longURL
  urlDatabase[req.params.id].longURL = req.body.longURL;
  res.redirect("/urls");
});



//Delete a URL
app.post("/urls/:id/delete", (req, res) => {
  const userId = req.session.userId;
  const id = req.params.id;
  const userUrlObject = urlDatabase[id];

  //1. If TinyURL doesn't exist in database
  if (!userUrlObject) {
    return res.status(400).send("<html><body>TinyURL not found. Maybe you could make it?</body></html>\n");
  }
  
  //2. If user isn't logged in -- direct them to reg || login
  if (!users[userId]) {
    return res.status(404).send("<html><body>Please register and login to access the tinyURLs!\n<b>Thank you!</b></body>\n<a href=/login <h3>Login Here!</h3></a>\n<a href=/register <h3>Register Here!</h3></body></html>\n");
  }

  //3. Checks if the current user own the conversion they're searching or not?
  if (doesTheUserOwnThisUrl(userId, id) === false) {
    return res.status(401).send("<html><body>This TinyURL belongs to someone else. Please register and login to access your very own tinyURLs!\n<b>Thank you!</b></body>\n<a href=/login <h3>Login Here!</h3></a>\n<a href=/register <h3>Register Here!</h3></body></html>\n");
  }

  //Happy Path :) -- User is verified and it is their url. It can be deleted from database
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});



//Server listening
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});