const jwt = require("jsonwebtoken");
const redis = require('redis');
require('dotenv').config();

const client = redis.createClient({
  host:  process.env.REDIS_HOST,
  port:  process.env.REDIS_PORT
});

client.on('connect', () => {
  console.log('Redis client connected');
});

client.on('error', (error) => {
  console.error('Redis error:', error);
});

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  client.get(token, (err, data) => {
    if (err) {
      res.status(500).send({ msg: "Error blacklisting token" });
    } else if (data === "blacklisted") {
      res.send("Token blacklisted, login again");
    } else {
      if (!token) {
        res.send("This route was protected, login first");
      } else {
        jwt.verify(token, "N_token", function (err, decode) {
          if (decode) {
            const userrole = decode?.role;
            req.body.userrole = userrole;
            next();
          } else {
            res.send({ msg: "Please login first", err });
          }
        });
      }
    }
  });
};

module.exports = { client, authenticate };
