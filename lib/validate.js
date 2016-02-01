var jwt = require('jsonwebtoken');

function signToken(tokenData) {
  return jwt.sign(tokenData, 'tokenSecretToBeReplaced');
}

function validateToken(token) {
  return jwt.verify(token, 'tokenSecretToBeReplaced');
}

function isJwtPresent(req) {
  return ('cookies' in req && 'jwt' in req.cookies);
}

function getUsername(req) {
  if (isJwtPresent(req)) {
    try {
      var token = validateToken(req.cookies.jwt);
      return token.username;
    } catch (err) {
      return null;
    }
  } else {
    return null;
  }
}

module.exports = {
  signToken: signToken,
  validateToken: validateToken,
  isJwtPresent: isJwtPresent,
  getUsername: getUsername,
};
