// auth.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const prisma = require('./prismaClient');
const { AuthenticationError, ForbiddenError } = require('apollo-server-express');

function requireAuth(user) {
  if (!user) throw new AuthenticationError("Authentication required");
  return user;
}

function requireRole(user, role) {
  requireAuth(user);
  if (user.role !== role) throw new ForbiddenError("Access denied");
  return user;
}

// Passport Google OAuth setup
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
  proxy: true
},
async (accessToken, refreshToken, profile, done) => {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { auth0Id: profile.id } 
    });

    if (existingUser) return done(null, existingUser);

    const newUser = await prisma.user.create({
      data: {
        email: profile.emails[0].value,
        name: profile.displayName,
        auth0Id: profile.id,
        avatar: profile.photos[0].value,
        role: 'UNASSIGNED'
      }
    });

    return done(null, newUser);
  } catch (error) {
    return done(error, null);
  }
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = {
  requireAuth,
  requireRole,
  passport
};
