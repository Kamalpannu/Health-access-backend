require('dotenv').config();

const express = require('express');
const http = require('http');
const session = require('express-session');
const { ApolloServer } = require('apollo-server-express');
const { passport } = require('./auth');
const typeDefs = require('./graphql/typeDefs');
const resolvers = require('./graphql/resolvers');
const cors = require('cors');
const path = require('path');

const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
console.log("PRIVATE_KEY length:", process.env.PRIVATE_KEY.length);
console.log("PRIVATE_KEY startsWith 0x:", process.env.PRIVATE_KEY.startsWith("0x"));


app.set('trust proxy', 1);

app.use(express.static(path.join(__dirname, 'public')));

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));

app.use(session({
  name: 'sid',
  secret: process.env.SESSION_SECRET || 'default-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,        
    httpOnly: true,
    sameSite: "none",      
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
}));

app.use(passport.initialize());
app.use(passport.session());


app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/auth/failure',
    session: true,
  }),
  (req, res) => {
    console.log('Google User:', req.user);
    res.redirect(FRONTEND_URL);
  }
);

// Logout
app.get('/logout', (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie('sid');
      res.redirect(FRONTEND_URL);
    });
  });
});

app.get('/auth/failure', (req, res) => {
  res.status(401).send('Google login failed.');
});


const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => ({
    user: req.user,
  }),
});

async function startServer() {
  await server.start();

  server.applyMiddleware({ app, cors: false });

  const PORT = process.env.PORT || 4000;
  http.createServer(app).listen(PORT, '0.0.0.0', () => {
    console.log(`Server ready at http://localhost:${PORT}${server.graphqlPath}`);
  });
}

startServer();
