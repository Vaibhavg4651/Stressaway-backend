import express from "express";
import dotenv from "dotenv";
import { errorHandler } from "./middleware/errorMiddleware.js";
import passport from "passport";
import connectDB from "./config/db.js";
import cp from "cookie-parser";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import bodyParser from "body-parser";
import user from "./src/routes/user.js";
import session from "express-session";
import Razorpay from "razorpay";

dotenv.config();
connectDB();
const app = express();

app.use(
  cors({
    origin: "https://stressaway.in",
    credentials: true,
  })
);
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(cp());

app.use("/", user);
app.use(
  session({
    secret: process.env.SECRET_KEY, // Replace with your own secret key
    resave: false,
    saveUninitialized: false,
  })
);
// app.use(cookieSession({ name: "session", keys: ["lama"], maxAge: 24 * 60 * 60 * 100 }))
app.use(passport.initialize());
app.use(passport.session());
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    successRedirect: "https://stressaway.in/user",
    failureRedirect: "/login/failed",
  })
);

app.get("/auth/facebook", passport.authenticate("facebook"));
app.get(
  "/auth/facebook/callback",
  passport.authenticate("facebook", {
    successRedirect: "https://stressaway.in/user",
    failureRedirect: "/login/failed",
  })
);

app.get("/auth/login/success", (req, res) => {
  if (req.user) {
    res.status(200).json({
      success: true,
      message: "user has successfully authenticated",
      user: req.user,
      cookies: req.cookies,
    });
  }
});

app.get("/logout", (req, res) => {
  req.logout();
  if (req.session && req.session.cookie) {
    res.cookie("connect.sid" ,null, { expires: new Date(Date.now()) , httpOnly: true });
  }

  req.session.destroy((err) => res.clearCookie("connect.sid"));
  res.redirect("https://stressaway.in");
});

app.get("/login/failed", (req, res) => {
  res.status(401).json({
    success: false,
    message: "user failed to authenticate.",
  });
});

app.get("/", (req, res) => {
  res.send("API is running....");
});

app.use(errorHandler);

//PAYMENT GATEWAY
export const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

app.get("/getkey", (req, res) => {
  res.status(200).json({ key: process.env.RAZORPAY_KEY_ID });
});

const PORT = process.env.PORT || 8000;

app.listen(PORT, console.log(`Server running on port ${PORT} `));
