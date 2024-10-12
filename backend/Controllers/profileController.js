const asyncHandler = require("express-async-handler");
const Profile = require("../Models/profileModel");
const User = require("../Models/userModels");

//@desc     Get User Profile
//@route    api/v1/profile/
//@access   Public
const getProfileByUserId = asyncHandler(async (req, res) => {
	const userId = req.user.id;

	const user = await User.findById(userId).populate("profile");

	if (!user) {
		res.status(404);
		throw new Error("Profile not found");
	}

	return res.status(200).json(user.profile);
});

//@desc     Create a new profile for a user
//@Route    api/v1/profile/
//@access   Public
const createProfile = asyncHandler(async (req, res) => {
	const userId = req.user.id;
	const { firstname, lastname, gender, phone, country } = req.body;

	// Validate input
	if (!firstname || !lastname || !gender || !phone || !country) {
		return res
			.status(400)
			.json({ message: "All profile fields are required" });
	}

	// Fetch the user from the database
	const user = await User.findById(userId);

	// Check if user exists
	if (!user) {
		return res.status(404).json({ message: "User not found" });
	}

	// Check if user already has a profile
	if (user.profile) {
		return res.status(400).json({ message: "User already has a profile" });
	}

	// Create a new Profile document
	const profile = await Profile.create({
		firstname,
		lastname,
		gender,
		phone,
		country,
	});

	// Associate the Profile with the User
	user.profile = profile._id;
	await user.save();

	// Return the created profile
	return res.status(201).json({
		success: true,
		data: profile,
	});
});

// @desc    Update current user's profile
// @route   PUT /api/v1/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
	const userId = req.user.id;

	const user = await User.findById(userId);

	if (!user) {
		res.status(404);
		throw new Error("User not found");
	}

	let profile = await Profile.findById(user.profile);

	if (!profile) {
		res.status(404);
		throw new Error("Profile not found");
	}

	profile = await Profile.findByIdAndUpdate(user.profile, req.body, {
		new: true,
		runValidators: true,
	});

	res.status(200).json({
		success: true,
		profile,
	});
});

module.exports = { getProfileByUserId, createProfile, updateProfile };
