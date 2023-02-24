const { urlencoded } = require("express");
const express = require("express");
const app = express();
const PORT = 8080; //default port 8080
var cookieSession = require('cookie-session');
const morgan = require("morgan");
const bcrypt = require("bcryptjs");


//Setting ejs engine with view folder
app.set("view engine", "ejs");

//Middleware
app.use(express.urlencoded({ extended: false }));
app.use(morgan("dev"));

app.use(cookieSession({
  name: 'CookieSesh',
  keys: ["key1", "key2"],
}));

//Database objects
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

const urlsForUser = (currentUserId) => {
  let userUrls = [];

  for (let tinyURL in urlDatabase) {
    const userIDsInSystem = urlDatabase[tinyURL].userID;
    if (currentUserId === userIDsInSystem) {
      userUrls.push({
        shortURL: tinyURL,
        longURL: urlDatabase[tinyURL].longURL
      });
    }
  }
  console.log("userURLS: ", userUrls);
  return userUrls;
};

const doesTheUserOwnThisUrl = (currentUserId, paramId) => {
  //1. Getting users URLs
  const usersUrls = urlsForUser(currentUserId); //returns array of users urls in objects
 //2. Checking if any of the users TinyURLs match the param.id of the url they're searching
  for (let url of usersUrls) {
    if (url.shortURL === paramId) {
       return true;
    }
  }
  return false;
};




//Main /urls page. URL list
app.get("/urls", (req, res) => {
  const userId = req.session.userId;
  console.log("URLS for userId: ", urlsForUser(userId));

  if (!userId) {
    return res.status(401).send("<html><body>You must register and be logged in to see the TinyURLs in all their glory!\n<a href=/login <h3>Login Here!</h3></a>\n<a href=/register <h3>Register Here!</h3></body></html>\n");
  }

  if (!urlsForUser(userId)) {
    return res.status(401).send("<html><body>You must register and be logged in to see the TinyURLs in all their glory!\n<a href=/login <h3>Login Here!</h3></a>\n<a href=/register <h3>Register Here!</h3></body></html>\n");
  }

  const templateVars = { 
    urls: urlsForUser(userId),
    user: users[userId]
  };
  console.log("templateVarUSER: ", templateVars.urls);
  res.render("urls_index", templateVars);
});

//Creates the tinyURL
app.post("/urls", (req, res) => {
  const userId = req.session.userId;
  if (!users[userId]) {
      return res.send("<html><body>Please register and login to access the tinyURL machine!\n<b>Thank you!</b></body></html>\n");
    };
  const tinyURL = generateRandomString();
  urlDatabase[tinyURL] = {};
  urlDatabase[tinyURL].longURL = req.body.longURL;
  urlDatabase[tinyURL].userID = userId;
  console.log("urlDB AFter adding url: ", urlDatabase[tinyURL]);
  console.log(`A tinyURL for ${urlDatabase[tinyURL].longURL} been created!`);
  res.redirect(`/urls/${tinyURL}`);
});

//Renders urls/new page when a new tinyURL has been created
app.get("/urls/new", (req, res) => {
  const userId = req.session.userId;
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

  if (!users[userId]) {
      return res.status(404).send("<html><body>Please register and login to access the tinyURLs!\n<b>Thank you!</b></body>\n<a href=/login <h3>Login Here!</h3></a>\n<a href=/register <h3>Register Here!</h3></body></html>\n");
    };

  if (doesTheUserOwnThisUrl(userId, id) === false) {
    return res.status(401).send("<html><body>This isn't your TinyURL. Please register and login to access your very own tinyURLs!\n<b>Thank you!</b></body>\n<a href=/login <h3>Login Here!</h3></a>\n<a href=/register <h3>Register Here!</h3></body></html>\n")
  };
    
  const templateVars = {
    user: users[userId],
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
  };
  console.log("templateVar.longURL: ", templateVars.longURL);
  // console.log("LONGURL FIX: ", urlDatabase[req.params.id].longURL, "id: ", req.params.id);
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
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  const generateUserId = generateRandomString();
  req.session.userId = generateUserId;
  users[generateUserId] = {
    id: generateUserId,
    email: req.body.email,
    password: hashedPassword
  };
  // console.log("hashedPW?? ", hashedPassword);
  // console.log("userObj: ", users[generateUserId]);
  // res.cookie("userId", generateUserId);
  // console.log("userDatabase: ", users);
  res.redirect("/urls");
});


//LOGIN ROUTES

//Renders /login
app.get("/login", (req, res) => {
  const userId = req.session.userId;
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
    
  //1. Checks if the input email exists in users database or not?
  const searchUsersDatabase = findUserFromEmail(req.body.email);
  console.log("searchUserDB:", searchUsersDatabase); 
  
  //2. Check if the existing userId's passwords matches the input password or not?
  if (!bcrypt.compareSync(req.body.password, searchUsersDatabase.password)) {
    return res.status(403).send("Passwords are not a match. Please check your password and try again.");
  }
  // if (searchUsersDatabase.password !== req.body.password) {
  //   return res.status(403).send("Passwords are not a match. Please check your password and try again.");
  // }

  //3. HappyPath -- If all was well then store the usersId in the userId Cookie and redirect to /urls.
  req.session.userId = searchUsersDatabase.id;
  // res.cookie("userId", searchUsersDatabase.id);
  res.redirect("/urls");
});

//LOGOUT
app.post("/logout", (req, res) => {
  // res.clearCookie("userId", req.session.userId);
  res.redirect("/login");
});

//Edit the longURL of an existing TinyURL conversion
app.post("/urls/:id", (req, res) => {
  const userId = req.session.userId;
  const id = req.params.id;
  const urlObject = urlDatabase[id];

  if (!urlObject) {
    return res.status(400).send("<html><body>TinyURL not found. Maybe you could make it?</body></html>\n");
  }

  if (!users[userId]) {
    return res.status(404).send("<html><body>Please register and login to access the tinyURLs!\n<b>Thank you!</b></body>\n<a href=/login <h3>Login Here!</h3></a>\n<a href=/register <h3>Register Here!</h3></body></html>\n");
  };

  if (doesTheUserOwnThisUrl(userId, id) === false) {
    return res.status(401).send("<html><body>This TinyURL belongs to someone else. Why not make it yourself!\n<b>Thank you!</b></body>\n<a href=/login <h3>Login Here!</h3></a>\n<a href=/register <h3>Register Here!</h3></body></html>\n")
  };

  console.log(`Updated LongURL: ${req.body.longURL}`)
  urlDatabase[req.params.id].longURL = req.body.longURL;
  res.redirect("/urls");
});

//Delete a URL
app.post("/urls/:id/delete", (req, res) => {
  const userId = req.session.userId;
  const id = req.params.id;
  const urlObject = urlDatabase[id];

    if (!urlObject) {
      return res.status(400).send("<html><body>TinyURL not found. Maybe you could make it?</body></html>\n");
    }

  if (!users[userId]) {
    return res.status(404).send("<html><body>Please register and login to access the tinyURLs!\n<b>Thank you!</b></body>\n<a href=/login <h3>Login Here!</h3></a>\n<a href=/register <h3>Register Here!</h3></body></html>\n");
  };

  if (doesTheUserOwnThisUrl(userId, id) === false) {
    return res.status(401).send("<html><body>This TinyURL belongs to someone else. Please register and login to access your very own tinyURLs!\n<b>Thank you!</b></body>\n<a href=/login <h3>Login Here!</h3></a>\n<a href=/register <h3>Register Here!</h3></body></html>\n")
  };

  // console.log(`The tinyURL for ${urlDatabase[req.params.id]} has been deleted!`);
  // console.log("ID NOW: ", urlDatabase[req.params.id]);
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

//Server listening
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
