const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../Models/userModels.js");
const crypto = require("crypto");

const validateToken = asyncHandler(async (req, res, next) => {
	// Extract token from cookies or Authorization header
	const token =
		req.headers.authorization &&
		req.headers.authorization.startsWith("Bearer") &&
		req.headers.authorization.split(" ")[1];
	// || req.cookies.token;

	if (!token) {
		res.status(401);
		throw new Error("Not authorized, no token");
	}

	try {
		// Verify token
		const decoded = jwt.verify(token, process.env.JWT_SECRET);

		// Find user by ID and exclude the password
		const user = await User.findById(decoded.id).select("-password");

		if (!user) {
			res.status(404);
			throw new Error("User not found");
		}

		// Attach user to the request object
		req.user = user;

		// Proceed to the next middleware or route handler
		next();
	} catch (error) {
		console.error(error);
		res.status(401);
		throw new Error("Invalid token");
	}
});

const authorizeRoles = (...roles) => {
	return (req, res, next) => {
		// Ensure req.user and req.user.role exist
		if (req.user && req.user.roles && roles.includes(req.user.roles)) {
			// If the user's role is included in the allowed roles, proceed to the next middleware
			return next();
		} else {
			// If the role is not included, respond with a 403 Forbidden error
			res.status(403).json({
				message: "Access forbidden: You do not have the required role",
			});
		}
	};
};

// Function to get options for setting cookies
const getCookieOptions = () => ({
	httpOnly: true,
	secure: process.env.NODE_ENV === "production", // Secure only in production
	expires: new Date(
		Date.now() +
			(process.env.JWT_COOKIE_EXPIRES_IN || 7) * 24 * 60 * 60 * 1000
	),
	sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax", // Adjust SameSite attribute
});

// Function to generate a JWT token
const generateToken = (id) => {
	return jwt.sign({ id }, process.env.JWT_SECRET, {
		expiresIn: process.env.JWT_EXPIRES_IN, // Sets the expiration time for the JWT
	});
};

// Function to generate a reset password token
const generateResetPasswordToken = () => {
	const resetToken = crypto.randomBytes(20).toString("hex");
	const resetPasswordToken = crypto
		.createHash("sha256")
		.update(resetToken)
		.digest("hex");
	return { resetToken, resetPasswordToken };
};

module.exports = {
	validateToken,
	authorizeRoles,
	getCookieOptions,
	generateToken,
	generateResetPasswordToken,
};
