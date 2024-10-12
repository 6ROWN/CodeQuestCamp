const express = require("express");
const {
	getReviews,
	getReview,
	createReview,
	updateReview,
	deleteReview,
} = require("../Controllers/reviewController");
const { validateToken } = require("../middleware/authMiddleware");

const router = express.Router({ mergeParams: true });

// Routes for getting all reviews of a bootcamp and creating a new review
router
	.route("/")
	.get(getReviews) // Public route to get all reviews for a specific bootcamp
	.post(validateToken, createReview); // Protected route to create a review (requires authentication)

// Routes for getting a single review, updating a review, and deleting a review
router
	.route("/:id")
	.get(getReview) // Public route to get a single review by ID
	.put(validateToken, updateReview) // Protected route to update a review (requires authentication)
	.delete(validateToken, deleteReview); // Protected route to delete a review (requires authentication)

module.exports = router;
