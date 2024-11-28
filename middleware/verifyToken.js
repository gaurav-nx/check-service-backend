const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization || req.query.token;
  console.log("🚀 ~ verifyToken ~ authHeader:", authHeader)
  const token = authHeader.substring(7);
  const secretKey = 'secret_key';
  if (!token) {
    return res.send({ error: 'Token is missing.' });
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      console.log(err);
      return res.send({ error: 'Token is invalid.' });
    }

    req.user = decoded;
    next();
  });
};

module.exports = { verifyToken }
