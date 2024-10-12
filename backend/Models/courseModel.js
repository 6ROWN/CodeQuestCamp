const mongoose = require("mongoose");

// Define the Prerequisite schema
const PrerequisiteSchema = new mongoose.Schema({
	title: {
		type: String,
		required: [true, "Please add a prerequisite title"],
		trim: true,
	},
});

// Define the Course schema
const CourseSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: [true, "Please add a course title"],
			trim: true,
			maxlength: [100, "Course title cannot be more than 100 characters"],
		},
		description: {
			type: String,
			required: [true, "Please add a description"],
			maxlength: [500, "Description cannot be more than 500 characters"],
		},
		duration: {
			type: Number,
			required: [true, "Please add the number of hours"],
		},
		instructor: {
			type: String,
			required: [true, "Please add an instructor name"],
		},
		prerequisites: {
			type: [PrerequisiteSchema],
			default: [],
		},
		bootcamp: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Bootcamp",
			required: true,
		},
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Course", CourseSchema);
