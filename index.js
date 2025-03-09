const express = require("express");
const exphbs = require("express-handlebars");
const fs = require("fs");
const session = require("express-session");
const path = require("path");
const Handlebars = require("handlebars");

const app = express();

// Register 'eq' helper
Handlebars.registerHelper("eq", function (a, b) {
  return a === b;
});

// Setup Handlebars
app.engine("hbs", exphbs.engine({ extname: ".hbs" }));
app.set("view engine", "hbs");

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public")); // Serve images from "public/images"

app.use(
  session({
    secret: "gallery_secret_key",
    resave: false,
    saveUninitialized: false, // Improved security
    cookie: { maxAge: 30 * 60 * 1000, httpOnly: true }, // 30 min session, secure cookie
  })
);

// Load users securely
let users = {};
const userFile = "user.json";
console.log("hello ");
if (fs.existsSync(userFile)) {
  users = JSON.parse(fs.readFileSync(userFile, "utf8"));
} else {
  console.warn("⚠️ user.json not found! No users loaded.");
}

// Sample image list (Ensure images exist in public/images/)
const images = [
  "BathroomStuff.jpg",
  "Cereal.jpg",
  "Cones.jpg",
  "ConesAndGrass.jpg",
  "Leafs.jpg",
  "Leafs2.jpg",
  "Matches.jpg",
  "Nuts.jpg",
  "Peppers.jpg",
  "Rocks.jpg",
];

const DEFAULT_IMAGE = "default.jpg";

// Routes
app.get("/", (req, res) => {
  if (req.session.user) {
    return res.redirect("/gallery");
  }
  res.render("login", { error: null });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!users[username]) {
    return res.render("login", { error: "Not a registered username" });
  }
  if (users[username] !== password) {
    return res.render("login", { error: "Invalid password" });
  }
  req.session.user = username;
  res.redirect("/gallery");
});

// GET Registration Page
app.get("/register", (req, res) => {
  res.render("register", { errorMessage: null });
});

// POST Registration Handler
app.post("/register", (req, res) => {
  const { username, password, confirmPassword } = req.body;

  // Validation
  if (users[username]) {
    return res.render("register", {
      errorMessage: "Email already registered",
    });
  }

  if (password !== confirmPassword) {
    return res.render("register", {
      errorMessage: "Passwords do not match",
    });
  }

  // Add new user
  users[username] = password;
  fs.writeFileSync("user.json", JSON.stringify(users, null, 2));

  // Redirect to login with success
  res.redirect("/?success=Account created successfully");
});

app.get("/gallery", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/");
  }
  res.render("gallery", {
    username: req.session.user,
    images,
    selectedImage: req.session.selectedImage || DEFAULT_IMAGE,
  });
});

app.post("/gallery", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/");
  }

  let selectedImage = req.body.image;
  if (!selectedImage || !images.includes(selectedImage)) {
    selectedImage = DEFAULT_IMAGE;
  }

  req.session.selectedImage = selectedImage;
  res.render("gallery", { username: req.session.user, images, selectedImage });
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
