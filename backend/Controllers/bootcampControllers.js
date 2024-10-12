const path = require("node:path");
const asyncHandler = require("express-async-handler");
const Bootcamp = require("../Models/bootcampModel");

/**
 * @desc    Get all bootcamps
 * @route   GET /api/v1/bootcamps
 * @access  Private
 */
const getBootcamps = asyncHandler(async (req, res) => {
	const bootcamps = await Bootcamp.find()
		.sort({
			createdAt: -1,
		})
		.populate("courses")
		.populate({
			path: "user",
			populate: {
				path: "profile",
				select: "firstname lastname", // Select the fields you want to include from the Profile model
			},
		});

	res.status(200).json({
		success: true,
		count: bootcamps.length,
		data: bootcamps,
	});
});

/**
 * @desc    Get single bootcamp
 * @route   GET /api/v1/bootcamps/:id
 * @access  Private
 */
const getSingleBootcamp = asyncHandler(async (req, res) => {
	const { id } = req.params;

	if (!id) {
		res.status(400);
		throw new Error("Id field is mandatory");
	}

	// Find bootcamp associated with the ID and populate user fields
	const bootcamp = await Bootcamp.findById(id).populate({
		path: "user",
		select: "-password",
	});

	if (!bootcamp) {
		res.status(400);
		throw new Error("Bootcamp does not exist");
	}

	// Send the bootcamp data in the response
	res.status(200).json({
		success: true,
		data: bootcamp,
	});
	return;
});

// @desc    Get all bootcamps for a specific user
// @route   GET /api/v1/bootcamps/user
// @access  Private

const getUserBootcamps = asyncHandler(async (req, res) => {
	const userId = req.user._id;

	const bootcamps = await Bootcamp.find({ user: userId });

	res.status(200).json({
		success: true,
		data: bootcamps,
	});
});

/**
 * @desc    Create new bootcamp
 * @route   POST /api/v1/bootcamps
 * @access  Private
 */
const createBootcamp = asyncHandler(async (req, res) => {
	// Add user to req.body
	req.body.user = req.user._id;

	// Check the number of bootcamps the user already has if the user is a moderator
	if (req.user.roles === "moderator") {
		const bootcampCount = await Bootcamp.countDocuments({
			user: req.user._id,
		});
		if (bootcampCount >= 50) {
			res.status(403);
			throw new Error(
				"You have exceeded your storage plan. Contact the admin to review options."
			);
		}
	}

	// Handle file upload
	if (req.files && req.files.photo) {
		const file = req.files.photo;

		// Check file size
		if (file.size > 1000000) {
			// 1MB
			res.status(400);
			throw new Error("Please upload an image less than 1MB.");
		}

		// Create custom file name
		file.name = `photo_${Date.now()}${path.parse(file.name).ext}`;

		// Define the upload path
		const uploadPath = `${process.env.FILE_UPLOAD_PATH}/${file.name}`;

		// Move file to upload directory
		file.mv(uploadPath, async (err) => {
			if (err) {
				console.error(err);
				res.status(500);
				throw new Error("Problem uploading image.");
			}

			// Add photo to req.body
			req.body.photo = file.name;

			// Create bootcamp
			const bootcamp = await Bootcamp.create(req.body);

			res.status(200).json({
				success: true,
				data: bootcamp,
			});
		});
	} else {
		// If no file is uploaded, just create bootcamp
		const bootcamp = await Bootcamp.create(req.body);

		res.status(200).json({
			success: true,
			data: bootcamp,
		});
	}
});

/**
 * @desc    Update existing bootcamp
 * @route   PUT /api/v1/bootcamps/:id
 * @access  Private
 */
const updateBootcamp = asyncHandler(async (req, res) => {
	const { id } = req.params;

	if (!id) {
		res.status(400);
		throw new Error("Bootcamp ID not provided");
	}

	//Check if bootcamp exist
	const bootcamp = await Bootcamp.findById(id);

	if (!bootcamp) {
		res.status(404);
		throw new Error("Bootcamp not found");
	}

	// Check if user is authorized to update bootcamp
	if (!bootcamp.user.equals(req.user._id) && req.user.role !== "admin") {
		res.status(403);
		throw new Error("User not authorized to update this bootcamp");
	}

	const updatedBootcamp = await Bootcamp.findByIdAndUpdate(id, req.body, {
		new: true,
		runValidators: true,
	});

	res.status(200).json({
		success: true,
		data: updatedBootcamp,
	});
	return;
});

/**
 * @desc    Delete bootcamp
 * @route   DELETE /api/v1/bootcamps/:id
 * @access  Private
 */

const deleteBootcamp = asyncHandler(async (req, res) => {
	const { id } = req.params;

	if (!id) {
		res.status(400);
		throw new Error("Bootcamp ID not provided");
	}

	const bootcamp = await Bootcamp.findById(id);

	if (!bootcamp) {
		res.status(404);
		throw new Error("Bootcamp does not exist");
	}

	// Check if user is authorized to update bootcamp
	if (!bootcamp.user.equals(req.user._id) && req.user.role === "admin") {
		res.status(403);
		throw new Error("User not authorized to delete this bootcamp");
	}

	await bootcamp.deleteOne(); // This will trigger the 'pre remove' middleware

	res.status(200).json({
		success: true,
	});
	return;
});

/**
 * @desc    Upload photo for bootcamp
 * @route   PUT /api/v1/bootcamps/:id/photo
 * @access  Private
 */
const uploadBootcampPhoto = asyncHandler(async (req, res, next) => {
	const bootcamp = await Bootcamp.findById(req.params.id);

	if (!bootcamp) {
		res.status(404);
		throw new Error("Bootcamp not found");
	}

	// Check if user is authorized to update bootcamp
	if (!bootcamp.user.equals(req.user._id) && req.user.role === "user") {
		res.status(403);
		throw new Error("User not authorized to update this photo");
	}

	if (!req.files) {
		res.status(400);
		throw new Error("Please upload a file");
	}

	const { photo: file } = req.files;

	// Ensure the image is a photo
	if (!file.mimetype.startsWith("image")) {
		res.status(400);
		throw new Error("Please upload an image file");
	}

	// Check file size
	if (file.size > 1000000) {
		res.status(400);
		throw new Error("Please upload an image less than 1MB");
	}

	// Create custom file name
	file.name = `photo_${bootcamp._id}${path.parse(file.name).ext}`;

	// Define the upload path
	const uploadPath = `${process.env.FILE_UPLOAD_PATH}/${file.name}`;

	file.mv(uploadPath, async (err) => {
		if (err) {
			console.error(err);
			res.status(500);
			throw new Error("Problem uploading image");
		}

		await Bootcamp.findByIdAndUpdate(req.params.id, { photo: file.name });

		res.status(200).json({
			success: true,
			data: file.name,
		});
	});
});

module.exports = {
	getBootcamps,
	getSingleBootcamp,
	getUserBootcamps,
	createBootcamp,
	updateBootcamp,
	deleteBootcamp,
	uploadBootcampPhoto,
};
