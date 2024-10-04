import express from "express";
import morgan from "morgan";
import path from "path";
import { create } from "express-handlebars";
import passport from "passport";
import cookieParser from "cookie-parser";
import session from "express-session";
import expressMySQLSession from "express-mysql-session";
import { promiseConnectFlash } from "async-connect-flash";
import { fileURLToPath } from "url";
import helmet from "helmet";
import cors from "cors";
import routes from "./routes/index.js";
import "./lib/passport.js";
import * as helpers from "./lib/handlebars.js";
import { pool } from "./database.js";
import csurf from "csurf";
import dotenv from 'dotenv';

dotenv.config();
const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MySQLStore = expressMySQLSession(session);

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

//CORS options - CSRF protection
const corsOptions = {
  origin: ["http://localhost:4000",              
    "https://fonts.googleapis.com",            
    "https://fonts.gstatic.com",               
    "https://cdnjs.cloudflare.com"        ],
  methods: "GET,PUT,POST,DELETE,OPTIONS",
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token','Set-Cookie', 'Cookie'],
  credentials: true,
};
app.use(cors(corsOptions));


const cspConfig = {
  directives: {
    defaultSrc: ["'self'"],
    fontSrc: ["'self'", "https://fonts.gstatic.com", "https://use.fontawesome.com", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
    scriptSrc: ["'self'", "https://cdn.jsdelivr.net", "https://accounts.google.com", "https://apis.google.com"],
    connectSrc: ["'self'", "https://accounts.google.com", "https://oauth2.googleapis.com", "https://www.googleapis.com"],
    frameSrc: ["'self'", "https://accounts.google.com"],
    styleSrc: ["'self'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net", "https://use.fontawesome.com", "https://cdnjs.cloudflare.com"]
  }
};

//set HSTS with helmet (Strict-Transport-Security)
if (process.env.NODE_ENV === 'production') {
  app.use(
    helmet.hsts({
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    })
  );
}

app.use(helmet.contentSecurityPolicy(cspConfig));

//middleware configuration
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser("faztmysqlnodemysql"));

//session middleware
app.use(
  session({
    secret: process.env.SECRET || 'some secret key',
    resave: false,
    saveUninitialized: false,
    store: new MySQLStore({}, pool),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      sameSite: 'lax'// SameSite attribute added for CSRF cookie
    },
  })
);

// CSRF Protection (must come after session middleware)
const csrfProtection = csurf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', 
    sameSite: 'lax',  // SameSite attribute added for CSRF cookie
  },
});
app.use(csrfProtection);

//middleware to set CSRF token in locals
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});



app.use(passport.initialize());
app.use(passport.session());


app.use(promiseConnectFlash());

//serve static files
app.use(express.static(path.join(__dirname, "public")));

//global variables middleware
app.use(async (req, res, next) => {
  res.locals.success = await req.getFlash("success");
  res.locals.error = await req.getFlash("error");
  res.locals.user = req.user;
  res.locals.success = await req.getFlash("success");
  res.locals.error = await req.getFlash("error");
  res.locals.user = req.user;
  next();
});

//routes
app.use('/',routes);

app.use((next) => {
  const err = new Error("Not Found");
  err.status = 404;
  next(err);
});

app.use((err,res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    res.status(403);
    res.send('Invalid CSRF token');
  } else {
    next(err);
  }
});

app.use((err,res, next) => {
  console.log("Error", err);
  res.status(err.status || 500);
  res.render("error", {
    message: err.message,
    status: err.status,
  });
});
export default app;
