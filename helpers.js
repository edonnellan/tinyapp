//Finds user object by using the users email
const findUserFromEmail = (emailAddress, userDatabase) => {
  for (let user in userDatabase) {
    if (userDatabase[user].email === emailAddress) {
      // console.log("userDatabase: ", userDatabase);
      return userDatabase[user];
    }
  }
  return undefined;
};


module.exports = { findUserFromEmail };