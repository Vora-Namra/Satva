import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { env } from "../../../config/index.js";
import { UserRepository } from "../auth.repository.js";
import { getHashedPassword } from "./bcrypt.js";

const userRepo = new UserRepository();

passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${env.GOOGLE_CALLBACKURL}/api/v1/auth/google/callback`,
      passReqToCallback: true,
    },
    async function (req, accessToken, refreshToken, profile, cb) {
      try {
        if (!profile.emails || !profile.emails[0]) {
          return cb(new Error("Email not Found In Google"));
        }
        const email = profile.emails[0].value;

        console.log(accessToken)
        req.session.googleToken=accessToken
        let user = await userRepo.findUserByEmail(email);
       
        if (!user) {
          const sub = profile._json.sub;
          const passwordHashed = await getHashedPassword(sub);
          const firstName = profile.name?.givenName || profile.displayName || '';
          const lastName = profile.name?.familyName || '';
          user = await userRepo.createGoogleUser(email, passwordHashed, sub, firstName, lastName);
        } else {
          if (user.role === 'PATIENT') {
            const firstName = profile.name?.givenName || profile.displayName || '';
            const lastName = profile.name?.familyName || '';
            await userRepo.ensurePatientExists(user.user_id, firstName, lastName);
          }
        }
        req.user = user;

        
        return cb(null, user);
      } catch (err) {
        return cb(err);
      }
    },
  ),
);

passport.serializeUser((user:any, done) => {

  done(null, user.user_id);
});
passport.deserializeUser(async (id, done) => {
  try {
    const user = await userRepo.findUserById(Number(id));
    console.log(user);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

export default passport;
