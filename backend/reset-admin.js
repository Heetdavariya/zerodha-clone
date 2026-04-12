require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const hashed = await bcrypt.hash("Admin@123", 12);
  const user = await User.findOneAndUpdate(
    { role: "admin" },
    { password: hashed },
    { new: true }
  );
  console.log("Password reset for:", user.email);
  process.exit();
});