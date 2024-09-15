import express from "express";
import morgan from "morgan";
import path from "path";
import { create } from "express-handlebars";
import passport from "passport";
import cookieParser from "cookie-parser";
import flash from "connect-flash";
import session from "express-session";
import expressMySQLSession from "express-mysql-session";
import { promiseConnectFlash } from "async-connect-flash";
import { fileURLToPath } from "url";
import helmet from "helmet";
import cors from "cors";
import routes from "./routes/index.js";
import "./lib/passport.js";
import * as helpers from "./lib/handlebars.js";
import { SECRET, database } from "./config.js";
import { pool } from "./database.js";
import csurf from "csurf";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MySQLStore = expressMySQLSession(session);

// Set views and view engine
app.set("views", path.join(__dirname, "views"));
app.engine(
  ".hbs",
  create({
    defaultLayout: "main",
    layoutsDir: path.join(app.get("views"), "layouts"),
    partialsDir: path.join(app.get("views"), "partials"),
    extname: ".hbs",
    helpers,
  }).engine
);
app.set("view engine", ".hbs");

// CORS options - CSRF protection
const corsOptions = {
  origin: [
    "http://localhost:4000",
  ],
  methods: "GET,PUT,POST,DELETE",
  allowedHeaders: "Content-Type, Authorization",
  credentials: true,
};

// Middleware configuration
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser("faztmysqlnodemysql"));

// Session middleware
app.use(
  session({
    secret: SECRET,
    resave: false,
    saveUninitialized: false,
    store: new MySQLStore({}, pool),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // secure only in production
    },
  })
);

// CSRF Protection (must come after session middleware)
const csrfProtection = csurf({ cookie: true });
app.use(csrfProtection);

// Middleware to set CSRF token in locals
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});

// Security middleware
app.use(cors(corsOptions));
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "https://cdn.jsdelivr.net", // Allow JS from jsdelivr CDN
      ],
      styleSrc: [
        "'self'",
        "https://cdn.jsdelivr.net", // Allow CSS from jsdelivr CDN (Bootstrap)
        "https://use.fontawesome.com", // Allow CSS from FontAwesome
        "https://fonts.googleapis.com", // Allow CSS from Google Fonts
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com", // Allow fonts from Google Fonts
        "https://use.fontawesome.com", // Allow fonts from FontAwesome
      ],
      imgSrc: ["'self'", "data:"], // Allow images from 'self' and data URIs
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  })
);



// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Flash messages setup
app.use(promiseConnectFlash());

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Global variables middleware
app.use(async (req, res, next) => {
  res.locals.success = await req.getFlash("success");
  res.locals.error = await req.getFlash("error");
  res.locals.user = req.user;
  next();
});

// Routes
app.use(routes);

// 404 error handler
app.use((req, res, next) => {
  const err = new Error("Not Found");
  err.status = 404;
  next(err);
});

// General error handler
app.use((err, req, res, next) => {
  console.log("Error", err);
  res.status(err.status || 500);
  res.render("error", {
    message: err.message,
    status: err.status,
  });
});

export default app;
