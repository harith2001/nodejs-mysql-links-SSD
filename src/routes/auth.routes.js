import { Router } from "express";
import {
  renderSignUp,
  signUp,
  renderSignIn,
  signIn,
  logout,
  googleCallback,
} from "../controllers/auth.controller.js";
import { validator } from "../middlewares/validator.middleware.js";
import { signinSchema, signupSchema } from "../schemas/auth.schema.js";
import passport from "passport";

const router = Router();

// SIGNUP
router.get("/signup", renderSignUp);
router.post("/signup", validator(signupSchema), signUp);

// SIGNIN
router.get("/signin", renderSignIn);
router.post("/signin", validator(signinSchema), signIn);

// Google OAuth - Login
router.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// Google OAuth - Callback
// router.get("/auth/google/callback",passport.authenticate("google",{ failureRedirect: "/signin" }),googleCallback);
router.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/links');
  }
);
// router.get("/auth/google/callback",passport.authenticate("google"),
//   (req, res) => {
//     res.redirect("/links");
//   });

// Logout
router.get("/logout", logout);

export default router;
