const mongoose = require("mongoose");
const Bootcamp = require("./bootcampModel");

const reviewSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		comment: {
			type: String,
			required: true,
			trim: true,
		},
		rating: {
			type: Number,
			required: true,
			min: 1,
			max: 5,
		},
		bootcamp: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Bootcamp",
			required: true,
		},
	},
	{
		timestamps: true,
	}
);

// Prevents a user from writing more than one review for the same bootcamp.
reviewSchema.index({ bootcamp: 1, user: 1 }, { unique: true });

// Calculate average rating after a review is saved
reviewSchema.post("save", async function () {
	await Bootcamp.calculateAverageRating(this.bootcamp);
});

// Calculate average rating after a review is deleted
reviewSchema.post(
	"deleteOne",
	{ document: true, query: false },
	async function () {
		await Bootcamp.calculateAverageRating(this.bootcamp);
	}
);

module.exports = mongoose.model("Review", reviewSchema);
