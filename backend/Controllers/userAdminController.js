const asyncHandler = require("express-async-handler");
const User = require("../Models/userModels");
const bcrypt = require("bcrypt");

//@desc     GET ALL USERS
//@route    GET api/v1/users
//@access   Private/Admin
const getUsers = asyncHandler(async (req, res) => {
	const users = await User.find({}).select("-password").populate("profile");
	res.status(200).json(users);
});

//@desc     GET SINGLE USER
//@route    GET api/v1/users/:id
//@access   Private/Admin
const getSingleUser = asyncHandler(async (req, res) => {
	const user = await User.findById(req.params.id)
		.select("-password")
		.populate("profile");

	if (user) {
		res.status(200).json(user);
	} else {
		res.status(404);
		throw new Error("User not found");
	}
});

//@desc     CREATE USER
//@route    POST api/v1/users
//@access   Private/Admin
const createUser = asyncHandler(async (req, res) => {
	const { username, email, password, roles } = req.body;

	const userExists = await User.findOne({ email });

	if (userExists) {
		res.status(400);
		throw new Error("User already exists");
		return;
	}

	const hashPassword = await bcrypt.hash(password, await bcrypt.genSalt(10));

	const user = await User.create({
		username,
		email,
		password: hashPassword,
		roles,
	});

	if (user) {
		res.status(201).json({
			_id: user._id,
			username: user.username,
			email: user.email,
			roles: user.roles,
		});
	} else {
		res.status(400);
		throw new Error("Invalid user data");
	}
});

//@desc     UPDATE USER
//@route    PUT api/v1/users/:id
//@access   Private/Admin
const updateUser = asyncHandler(async (req, res) => {
	const user = await User.findById(req.params.id);

	if (user) {
		user.username = req.body.username || user.username;
		user.email = req.body.email || user.email;
		user.roles = req.body.roles || user.roles;

		if (req.body.password) {
			user.password = req.body.password;
		}

		const updatedUser = await user.save();
		res.status(200).json({
			_id: updatedUser._id,
			username: updatedUser.username,
			email: updatedUser.email,
			roles: updatedUser.roles,
		});
	} else {
		res.status(404);
		throw new Error("User not found");
	}
});

//@desc     DELETE USER
//@route    DELETE api/v1/users/:id
//@access   Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
	const user = await User.findById(req.params.id);

	if (user) {
		await user.deleteOne();
		res.status(200).json({ message: "User removed" });
	} else {
		res.status(404);
		throw new Error("User not found");
	}
});

module.exports = {
	getUsers,
	getSingleUser,
	createUser,
	updateUser,
	deleteUser,
};
