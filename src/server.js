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

app.set('trust proxy', 1);

app.use(express.static(path.join(__dirname, 'public')));

app.use(cors({
  origin: process.env.FRONTEND_URL, 
  credentials: true
}));


app.use(session({
  secret: process.env.SESSION_SECRET || 'default-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    httpOnly: true,      
    sameSite: 'none',
    maxAge: 24 * 60 * 60 * 1000,
    domain: '.preetkamal.xyz'   
  }
}));

app.use(passport.initialize());
app.use(passport.session());

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed`,
    session: true
  }),
  (req, res) => {
    console.log('User authenticated:', req.user);
    res.redirect(`${process.env.FRONTEND_URL}?login=success`);
  }
);

// 🔒 Logout
app.get('/logout', (req, res, next) => {
  req.logout(function(err) {
    if (err) return next(err);
    req.session.destroy(() => {
      res.redirect('/');
    });
  });
});
app.get('/auth/failure', (req, res) => {
  res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
});
app.get('/auth/debug', (req, res) => {
  res.json({
    user: req.user,
    session: req.session,
    isAuthenticated: req.isAuthenticated(),
    cookies: req.cookies,
    headers: req.headers
  });
});
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => ({
    user: req.user
  }),
})
async function startServer() {
  await server.start();
  server.applyMiddleware({ app, cors: false });

  const PORT = process.env.PORT || 4000;
  http.createServer(app).listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}${server.graphqlPath}`);
  });
}

startServer();
