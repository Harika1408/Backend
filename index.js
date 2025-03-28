require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// Models
const User = mongoose.model("User", new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
}));

const Transaction = mongoose.model("Transaction", new mongoose.Schema({
  sender: String,
  receiver: String,
  amount: Number,
  date: { type: Date, default: Date.now },
}));

// Routes

// User Registration
app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await User.create({ name, email, password: hashedPassword });
    res.status(201).json({ message: "User created", user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// User Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
  res.json({ message: "Login successful", token });
});

// Get Transactions
app.get("/transactions", async (req, res) => {
  const transactions = await Transaction.find();
  res.json(transactions);
});

// Send Payment
app.post("/send-payment", async (req, res) => {
  const { sender, receiver, amount } = req.body;

  try {
    const transaction = await Transaction.create({ sender, receiver, amount });
    res.status(201).json({ message: "Payment sent", transaction });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Receive Payment
app.post("/receive-payment", async (req, res) => {
  const { sender, receiver, amount } = req.body;

  try {
    const transaction = await Transaction.create({ sender, receiver, amount });
    res.status(201).json({ message: "Payment received", transaction });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
