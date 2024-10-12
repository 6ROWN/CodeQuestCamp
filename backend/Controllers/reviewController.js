const asyncHandler = require("express-async-handler");
const Review = require("../Models/reviewModel");
const Bootcamp = require("../Models/bootcampModel");

// @desc    Get a single Review by ID
// @route   GET api/v1/reviews/:id
// @access  Public
const getReview = asyncHandler(async (req, res) => {
	const { id } = req.params;
	console.log(id);

	// Fetch the review from the database by ID
	const review = await Review.findById(id).populate({
		path: "bootcamp",
		select: "content rating",
	});

	// If the review is not found, return a 404 error
	if (!review) {
		res.status(404);
		throw new Error("Review not found");
	}

	// If found, send the review data
	res.status(200).json({
		success: true,
		data: review,
	});
});

// @desc    GET Reviews from Bootcamp
// @route   GET api/v1/bootcamp/:bootcampId/reviews
// @access  Public
const getReviews = asyncHandler(async (req, res) => {
	const { bootcampId } = req.params;

	if (!bootcampId) {
		res.status(400);
		throw new Error("Bootcamp Id is required");
	}

	const reviews = await Review.find({ bootcamp: bootcampId })
		.populate({
			path: "user",
			select: "-password",
			populate: {
				path: "profile",
				select: "firstname lastname",
			},
		})
		.exec();
	if (!reviews || reviews.length === 0) {
		res.status(404);
		throw new Error("No reviews found for this bootcamp");
	}

	res.status(200).json({
		success: true,
		count: reviews.length,
		data: reviews,
	});
});

// @desc    Create Reviews from Bootcamp
// @route   POST api/v1/bootcamp/:bootcampId/reviews
// @access  Private
const createReview = asyncHandler(async (req, res) => {
	const { bootcampId } = req.params;

	// Validate bootcampId
	const bootcamp = await Bootcamp.findById(bootcampId);
	if (!bootcamp) {
		res.status(404);
		throw new Error("Bootcamp not found");
	}

	// Check if user is the owner of the bootcamp
	if (bootcamp.user.equals(req.user._id)) {
		res.status(403);
		throw new Error(
			"User not authorized to add a review for their own bootcamp"
		);
	}

	// Add bootcamp and user IDs to the request body
	req.body.bootcamp = bootcampId;
	req.body.user = req.user._id;

	try {
		const review = await Review.create(req.body);

		res.status(201).json({
			success: true,
			data: review,
		});
	} catch (error) {
		if (error.code === 11000) {
			// Duplicate key error
			res.status(400);
			throw new Error(
				"You can only leave one review per bootcamp. You've already submitted yours. Thanks for your feedback!"
			);
		} else {
			res.status(500);
			throw new Error("Server Error");
		}
	}
});

// @desc    Update Review
// @route   PUT api/v1/reviews/:id
// @access  Private
const updateReview = asyncHandler(async (req, res) => {
	const { id } = req.params;

	let review = await Review.findById(id);
	if (!review) {
		res.status(404);
		throw new Error("Review not found");
	}

	// Check if user is the owner of the review
	if (!review.user.equals(req.user._id)) {
		res.status(403);
		throw new Error("User not authorized to update this review");
	}

	review = await Review.findByIdAndUpdate(id, req.body, {
		new: true,
		runValidators: true,
	});

	res.status(200).json({
		success: true,
		data: review,
	});
});

// @desc    Delete Review
// @route   DELETE api/v1/reviews/:id
// @access  Private
const deleteReview = asyncHandler(async (req, res) => {
	const { id } = req.params;

	const review = await Review.findById(id);
	if (!review) {
		res.status(404);
		throw new Error("Review not found");
	}

	// Check if user is the owner of the review
	if (!review.user.equals(req.user._id)) {
		res.status(403);
		throw new Error("User not authorized to delete this review");
	}

	await review.deleteOne();

	res.status(200).json({
		success: true,
		message: "Review removed",
	});
});

module.exports = {
	getReviews,
	getReview,
	createReview,
	updateReview,
	deleteReview,
};
