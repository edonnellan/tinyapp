const { assert } = require('chai');

const { findUserFromEmail } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

//findUserFromEmail function tests
describe('findUserFromEmail', function() {
  it('should return a user with valid email', function() {
    const user = findUserFromEmail("user@example.com", testUsers);
    const expectedUserID = "userRandomID";
    assert.strictEqual(user.id, expectedUserID);
  });

  it("should return undefined if the users email is not valid", () => {
    const userOutput = findUserFromEmail("ser2@example.com", testUsers);
    const expectedOutput = undefined;
    assert.strictEqual(userOutput, expectedOutput);
  });
});

