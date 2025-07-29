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
  proxy: true,
}, 
async (accessToken, refreshToken, profile, done) => {
  console.log('Google OAuth callback profile:', profile);

  try {
    const existingUser = await prisma.user.findUnique({
      where: { auth0Id: profile.id }
    });

    if (existingUser) {
      console.log('Existing user found:', existingUser);
      return done(null, existingUser);
    }

    const newUser = await prisma.user.create({
      data: {
        email: profile.emails[0].value,
        name: profile.displayName,
        auth0Id: profile.id,
        avatar: profile.photos[0]?.value || null,
        role: 'UNASSIGNED'
      }
    });

    console.log('New user created:', newUser);
    return done(null, newUser);

  } catch (error) {
    console.error('Error in Google strategy verify callback:', error);
    return done(error, null);
  }
}));

passport.serializeUser((user, done) => {
  console.log('serializeUser called with user:', user);
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  console.log('deserializeUser called with id:', id);
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (error) {
    console.error('Error in deserializeUser:', error);
    done(error, null);
  }
});

module.exports = {
  requireAuth,
  requireRole,
  passport
};
