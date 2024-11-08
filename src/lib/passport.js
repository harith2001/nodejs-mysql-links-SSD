import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { pool } from "../database.js";
import { matchPassword } from "./helpers.js";
import crypto from 'crypto';

// Local Strategy for signing in
passport.use(
  "local.signin",
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
      passReqToCallback: true,
    },
    async (req, email, password, done) => {
      try {
        const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [
          email,
        ]);

        if (!rows.length) {
          await req.setFlash("error", "No user found");
          return done(null, false);
        }

        const user = rows[0];
        const validPassword = await matchPassword(password, user.password);

        if (!validPassword) {
          await req.setFlash("error", "Incorrect Password");
          return done(null, false);
        }

        done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

//google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if the user exists in the database
        const [rows] = await pool.query(
          "SELECT * FROM users WHERE google_id = ?",
          [profile.id]
        );

        if (rows.length) {
          // User exists, log them in
          return done(null, rows[0]);
        } else {
          // New user, insert them into the database
          const newUser = {
            google_id: profile.id,
            email: profile.emails[0].value,
            fullname: profile.displayName,
            password: crypto.randomBytes(20).toString('hex')
          };
          const result = await pool.query("INSERT INTO users SET ?", newUser);
          newUser.id = result[0].insertId; 
          return done(null, newUser);
        }
      } catch (err) {
        return done(err);
      }
    }
  )
);

//serialize the user to store in session
passport.serializeUser((user, done) => {
  done(null, user.id); 
});

//deserialize the user based on the ID stored in the session
passport.deserializeUser(async(id, done) => {
  try {
    const [rows] =await pool.query("SELECT * FROM users WHERE id = ?", [id]);
    done(null, rows[0]); 
  } catch (err) {
    done(err, null);
  }
});



