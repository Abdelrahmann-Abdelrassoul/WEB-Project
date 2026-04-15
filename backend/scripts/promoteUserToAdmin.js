import "../config/env.js";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/userModel.js";

const targetEmail = process.argv[2]?.trim().toLowerCase();

if (!targetEmail) {
  console.error('Usage: npm run promote-admin -- "user@example.com"');
  process.exit(1);
}

const promoteUser = async () => {
  try {
    await connectDB();

    const user = await User.findOneAndUpdate(
      { email: targetEmail },
      { $set: { role: "admin", active: true, accountStatus: "active" } },
      { new: true }
    ).select("_id username email role active accountStatus");

    if (!user) {
      console.error(`No user found with email: ${targetEmail}`);
      process.exitCode = 1;
      return;
    }

    console.log("User promoted successfully:");
    console.log(JSON.stringify(user, null, 2));
  } catch (error) {
    console.error("Failed to promote user:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

promoteUser();
