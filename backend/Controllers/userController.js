const asyncHandler = require("express-async-handler");
const validator = require("validator");
const User = require("../Models/userModels");
const bcrypt = require("bcrypt");
const sendEmail = require("../utils/sendEmail");
//const sendEmail = require("../mailtrap/mailtrap.config");
const crypto = require("crypto");
const {
	getCookieOptions,
	generateToken,
	generateResetPasswordToken,
} = require("../middleware/authMiddleware");

//@desc     Register a new user
//@route    POST api/v1/auth/register
//@access   Public
const registerUser = asyncHandler(async (req, res, next) => {
	const { username, email, password, roles = "user" } = req.body;

	// Validate input
	if (!username || !email || !password || !roles) {
		res.status(400);
		throw new Error("All fields are required");
	}
	if (!validator.isLength(username, { min: 3, max: 20 })) {
		res.status(400);
		throw new Error("Username must be between 3 and 20 characters");
	}
	if (!validator.isAlphanumeric(username)) {
		res.status(400);
		throw new Error("Username must contain only letters and numbers");
	}
	if (!validator.isEmail(email)) {
		res.status(400);
		throw new Error("Email is not valid");
	}
	if (!validator.isStrongPassword(password)) {
		res.status(400);
		throw new Error(
			"Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character"
		);
	}

	// Check if user exists
	const existingUser = await User.findOne({ $or: [{ username }, { email }] });
	if (existingUser) {
		if (existingUser.username === username) {
			res.status(400);
			throw new Error(
				`${username} is already taken. Please choose a different username.`
			);
		}
		if (existingUser.email === email) {
			res.status(400);
			throw new Error(`User already exist.`);
		}
	}

	// Hash password
	const salt = await bcrypt.genSalt(10);
	const hashedPassword = await bcrypt.hash(password, salt);

	// Create user
	const user = await User.create({
		username,
		email,
		password: hashedPassword,
		roles,
	});

	// Generate token and set cookie
	const token = generateToken(user._id);
	res.cookie("token", token, getCookieOptions());

	res.status(201).json({
		_id: user._id,
		token,
		user,
	});
});

//@desc     Login existing user
//@route    POST api/v1/auth/login
//@access   Public
const loginUser = asyncHandler(async (req, res, next) => {
	const { email, password } = req.body;

	// Validate input
	if (!email || !password) {
		res.status(400);
		throw new Error("All fields are mandatory");
	}

	// Check if user exists
	const user = await User.findOne({ email });
	if (!user) {
		res.status(400);
		throw new Error("Invalid credentials");
	}

	// Validate password
	const matchedPassword = await bcrypt.compare(password, user.password);
	if (!matchedPassword) {
		res.status(400);
		throw new Error("Invalid credentials");
	}

	// Generate token and set cookie
	const token = generateToken(user._id);
	res.cookie("token", token, getCookieOptions());

	res.status(200).json({
		_id: user._id,
		token,
	});
});

// @desc    Get current user that is logged in
// @route   GET api/v1/auth/me
// @access  Private
const getCurrentUser = asyncHandler(async (req, res) => {
	const userId = req.user.id;

	// Fetch user details from the database
	const user = await User.findById(userId)
		.select("-password")
		.populate("profile"); // Adjust this if 'profile' is not a valid field

	if (!user) {
		res.status(404);
		throw new Error("User not found");
	}

	res.status(200).json({
		_id: user._id,
		user,
	});
});

// @desc     Forgot password
// @route    POST api/v1/auth/forgotpassword
// @access   Public
const forgotPassword = asyncHandler(async (req, res) => {
	const { email } = req.body;

	// Validate input
	if (!email) {
		res.status(400);
		throw new Error("Email is required");
	}

	// Check if user exists
	const user = await User.findOne({ email });
	if (!user) {
		res.status(400);
		throw new Error("There is no user with that email address");
	}

	// Generate reset token
	const { resetToken, resetPasswordToken } = generateResetPasswordToken();
	user.resetPasswordToken = resetPasswordToken;
	user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // Token expires in 10 minutes

	await user.save();

	// Create reset URL
	const resetUrl = `${req.protocol}://${req.get(
		"host"
	)}/api/v1/auth/resetpassword/${resetToken}`;

	// Create email message
	const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a put request to: \n\n ${resetUrl}`;

	try {
		await sendEmail({
			email: user.email,
			subject: "Password reset token",
			message,
		});

		res.status(200).json({
			success: true,
			message: "Email sent",
			resetUrl,
		});
	} catch (error) {
		user.resetPasswordToken = undefined;
		user.resetPasswordExpires = undefined;

		await user.save();

		res.status(500);
		throw new Error("Email could not be sent");
	}
});

// @desc     Reset password
// @route    PUT api/v1/auth/resetpassword/:resetToken
// @access   Public
const resetPassword = asyncHandler(async (req, res) => {
	// Validate input
	if (!req.body.password) {
		res.status(400);
		throw new Error("Password is required");
	}

	//Validate password
	if (!validator.isStrongPassword(req.body.password)) {
		res.status(400);
		throw new Error(
			"Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character"
		);
	}

	// Hash reset token
	const resetPasswordToken = crypto
		.createHash("sha256")
		.update(req.params.resetToken)
		.digest("hex");

	// Find user by reset token and check if token has not expired
	const user = await User.findOne({
		resetPasswordToken,
		resetPasswordExpires: { $gt: Date.now() },
	});

	if (!user) {
		res.status(400);
		throw new Error("Invalid or expired token");
	}

	// Hash new password
	user.password = await bcrypt.hash(
		req.body.password,
		await bcrypt.genSalt(10)
	);

	// Clear reset token and expiry
	user.resetPasswordToken = undefined;
	user.resetPasswordExpires = undefined;

	// Save user
	await user.save();

	// Generate token and set cookie
	const token = generateToken(user._id);
	res.cookie("token", token, getCookieOptions());

	res.status(200).json({
		success: true,
		message: "Password has been reset",
		token,
	});
});

//@desc 	Update user password
//@route 	PUT api/v1/auth/updatepassword
//@access 	Private
const updatePassword = asyncHandler(async (req, res) => {
	const { currentPassword, newPassword } = req.body;

	if (!currentPassword || !newPassword) {
		res.status(400);
		throw newError("All fields are mandatory");
	}

	// Validate the new password strength
	if (!validator.isStrongPassword(req.body.newPassword)) {
		res.status(400);
		throw new Error(
			"New password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character"
		);
	}

	// Find the user by ID and include the password field
	const user = await User.findById(req.user._id).select("+password");

	if (!user) {
		res.status(404);
		throw new Error("User not found");
	}

	// Compare the old password input with the current password
	const isMatch = await bcrypt.compare(
		req.body.currentPassword,
		user.password
	);

	if (!isMatch) {
		res.status(400);
		throw new Error("Current password is incorrect");
	}

	// Hash the new password before saving
	const salt = await bcrypt.genSalt(10);
	user.password = await bcrypt.hash(req.body.newPassword, salt);

	// Save the user with the new password
	await user.save();

	// Generate token and set cookie
	const token = generateToken(user._id);

	// Set token in cookie with options
	res.cookie("token", token, getCookieOptions());

	// Send response
	res.status(200).json({
		success: true,
		message: "Password updated successfully",
		_id: user._id,
		token,
	});
});

// @desc    Change user role
// @route   PUT api/v1/users/:id/role
// @access  Private/Admin
const changeUserRole = asyncHandler(async (req, res) => {
	const { role } = req.body;

	// Validate input
	if (!role || !["user", "admin", "moderator"].includes(role)) {
		res.status(400);
		throw new Error("Invalid role");
	}

	// Find user by ID
	const user = await User.findById(req.params.id);

	if (!user) {
		res.status(404);
		throw new Error("User not found");
	}

	// Update user role
	user.roles = [role];
	await user.save();

	res.status(200).json({
		success: true,
		message: "User role updated",
		user,
	});
});

module.exports = {
	registerUser,
	loginUser,
	getCurrentUser,
	forgotPassword,
	resetPassword,
	updatePassword,
	changeUserRole,
};
