const findUserFromEmail = (emailAddress, userDatabase) => {
  for (let user in userDatabase) {
    if (userDatabase[user].email === emailAddress) {
      // console.log("userDatabase: ", userDatabase);
      return userDatabase[user];
    }
  }
  return null;
};


module.exports = { findUserFromEmail };