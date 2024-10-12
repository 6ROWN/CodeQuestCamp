const express = require("express");
const path = require("node:path");
const dotenv = require("dotenv");
const colors = require("colors");
const cors = require("cors");
const morgan = require("morgan");
const userRoutes = require("./Routes/userRoutes");
const bootcampRoutes = require("./Routes/bootcampRoutes");
const courseRoutes = require("./Routes/courseRoutes");
const userAdminRoutes = require("./Routes/userAdminRoutes");
const reviewRoutes = require("./Routes/reviewRoutes");
const profileRoutes = require("./Routes/profileRoutes");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");

// Load environment variables from .env file
dotenv.config();

// Connect to the database
connectDB();

// Initialize the app
const app = express();

// Server configuration
const PORT = process.env.PORT || 8000;
const ENV = process.env.NODE_ENV || "development";

app.use(
	cors({
		origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
		methods: ["GET", "POST", "PUT", "DELETE"],
		credentials: true,
	})
);

// Middleware
app.use(express.json());
app.use(morgan("dev")); // Log requests to the console
app.use(cookieParser());

// File uploading
app.use(fileUpload());

// Set static folder
app.use(express.static(path.join(__dirname, "../frontend/public")));

// Mount Routes
app.use("/api/v1/auth", userRoutes);
app.use("/api/v1/bootcamps", bootcampRoutes);
app.use("/api/v1/courses", courseRoutes);
app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/v1/users", userAdminRoutes);
app.use("/api/v1/profile", profileRoutes);

// Use the error handling middleware
app.use(errorHandler);

// Start the server
app.listen(PORT, () => {
	console.log(`Server running in ${ENV} mode on port ${PORT}`.green.bold);
});
