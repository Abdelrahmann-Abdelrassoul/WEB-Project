import "./config/env.js";
import app from "./app.js";
import connectDB from "./config/db.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();

// handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION:", err);
  process.exit(1);
});