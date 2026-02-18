const session = require('express-session');
const MongoStore = require('connect-mongo');
const { v4: uuidv4 } = require('uuid');

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  cookie: { secure: process.env.NODE_ENV === 'production', httpOnly: true, maxAge: 86400000 },
});

// Attach anonymous ID to session if not present
const attachAnonId = (req, res, next) => {
  if (!req.session.anonId) {
    req.session.anonId = uuidv4();
  }
  next();
};

module.exports = { sessionMiddleware, attachAnonId };
