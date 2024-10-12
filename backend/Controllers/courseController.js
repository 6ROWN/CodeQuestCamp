const asyncHandler = require("express-async-handler");
const Course = require("../Models/courseModel");
const Bootcamp = require("../Models/bootcampModel");

// @desc    Get the list of all courses
// @route   GET /api/v1/courses
// @route   GET /api/v1/bootcamp/:bootcampId/courses
// @access  Private
const getAllCourses = asyncHandler(async (req, res) => {
	const { bootcampId } = req.params;

	let courses;
	if (bootcampId) {
		courses = await Course.find({ bootcamp: bootcampId });
	} else {
		courses = await Course.find().populate({
			path: "bootcamp",
			select: "name description",
		});
	}

	res.status(200).json({
		success: true,
		count: courses.length,
		data: courses,
	});
});

// @desc    Get single course
// @route   GET /api/v1/courses/:id
// @access  Private
const getSingleCourse = asyncHandler(async (req, res) => {
	const { id } = req.params;

	if (!id) {
		res.status(400);
		throw new Error("Course ID not provided");
	}

	const course = await Course.findById(id).populate({
		path: "bootcamp",
		select: "name description",
	});

	if (!course) {
		res.status(404);
		throw new Error("Course not found");
	}

	res.status(200).json({
		success: true,
		data: course,
	});
});

// @desc    Get course by specific user
// @route   GET /api/v1/courses/user
// @access  Private
const getUserCourses = asyncHandler(async (req, res) => {
	const userId = req.user._id;

	const courses = await Course.find({ user: userId });

	res.status(200).json({
		success: true,
		data: courses,
	});
});

// @desc    Create new course
// @route   POST /api/v1/bootcamps/:bootcampId/courses
// @access  Private
const createCourse = asyncHandler(async (req, res) => {
	const { bootcampId } = req.params;

	// Validate bootcampId
	const bootcamp = await Bootcamp.findById(bootcampId);
	if (!bootcamp) {
		res.status(404);
		throw new Error("Bootcamp not found");
	}

	// Add bootcamp and user IDs to the request body
	req.body.bootcamp = bootcampId;
	req.body.user = req.user._id;

	//Check if the owner owns this course
	if (!bootcamp.user.equals(req.user._id) && req.user.roles !== "admin") {
		res.status(403);
		throw new Error("User not authorized to add a course");
	}

	const course = await Course.create(req.body);

	res.status(201).json({
		success: true,
		data: course,
	});
});

// @desc    Update existing course
// @route   PUT /api/v1/courses/:id
// @access  Private
const updateExistingCourse = asyncHandler(async (req, res) => {
	const { id } = req.params;

	if (!id) {
		res.status(400);
		throw new Error("Course ID not provided");
	}

	let course = await Course.findById(id);

	if (!course) {
		res.status(404);
		throw new Error("Course not found");
	}

	//Ensure user is authorized to update course
	if (!course.user.equals(req.user._id) && req.user.roles == "user") {
		res.status(403);
		throw new Error("User not authorized to update this course");
	}

	course = await Course.findByIdAndUpdate(id, req.body, {
		new: true,
		runValidators: true,
	});

	res.status(200).json({
		success: true,
		data: course,
	});
});

// @desc    Delete course
// @route   DELETE /api/v1/courses/:id
// @access  Private
const deleteCourse = asyncHandler(async (req, res) => {
	const { id } = req.params;

	if (!id) {
		res.status(400);
		throw new Error("Course ID not provided");
	}

	const course = await Course.findById(id);

	if (!course) {
		res.status(404);
		throw new Error("Course not found");
	}

	//Ensure user is authorized to update course
	if (!course.user.equals(req.user._id) && req.user.roles == "user") {
		res.status(403);
		throw new Error("User not authorized to delete this course");
	}

	await course.deleteOne();

	res.status(200).json({
		success: true,
		data: {},
	});
});

module.exports = {
	getAllCourses,
	createCourse,
	getSingleCourse,
	updateExistingCourse,
	deleteCourse,
	getUserCourses,
};
