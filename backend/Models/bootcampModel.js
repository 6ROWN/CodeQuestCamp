const mongoose = require("mongoose");
const categories = require("../utils/categories.json");

// Create Bootcamp Schema
const BootcampSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, "Please add a name"],
			unique: true,
			trim: true,
			maxlength: [50, "Name cannot be more than 50 characters"],
		},
		slug: String,
		description: {
			type: String,
			required: [true, "Please add a description"],
			maxlength: [500, "Description cannot be more than 500 characters"],
		},
		phone: {
			type: String,
			match: [/^\+?[1-9]\d{1,14}$/, "Please use a valid phone number"],
		},
		email: {
			type: String,
			match: [/^\S+@\S+\.\S+$/, "Please use a valid email address"],
		},
		duration: {
			type: Number,
			required: [true, "Please add the duration"],
		},
		level: {
			type: String,
			enum: ["Beginner", "Intermediate", "Advanced"],
			default: "Beginner",
		},
		website: {
			type: String,
			match: [
				/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
				"Please use a valid URL with HTTP or HTTPS",
			],
		},
		onlineAvailable: {
			type: Boolean,
			default: false,
		},
		address: {
			type: String,
			validate: {
				validator: function (value) {
					if (this.onlineAvailable) {
						return true;
					}

					return value && value.trim().length > 0;
				},
				message: "Address is required if the bootcamp is not online",
			},
		},
		electronicMedium: {
			type: String,
			enum: ["zoom", "google meet", "other"],
			validate: {
				validator: function (value) {
					return this.onlineAvailable ? value : true; // Skip validation if onlineAvailable is false
				},
				message:
					"Please select a valid electronic medium if the bootcamp is online",
			},
			required: function () {
				return this.onlineAvailable;
			},
		},
		mediumLink: {
			type: String,
			match: [
				/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
				"Please use a valid URL with HTTP or HTTPS",
			],
			validate: {
				validator: function (value) {
					return this.onlineAvailable ? value : true; // Skip validation if onlineAvailable is false
				},
				message: "Please provide a valid URL if the bootcamp is online",
			},
			required: function () {
				return this.onlineAvailable;
			},
		},
		category: {
			type: [String],
			enum: categories,
			required: true,
		},
		averageRating: {
			type: Number,
		},
		costType: {
			type: String,
			enum: ["Free", "Paid"],
			required: [true, "Please specify if the bootcamp is free or paid"],
		},
		price: {
			type: Number,
			required: function () {
				return this.costType === "Paid";
			},
			min: [0, "Price must be a positive number"],
		},
		startDate: {
			type: Date,
			required: [true, "Please add a start date"],
		},
		endDate: {
			type: Date,
		},
		photo: {
			type: String,
			default: "default.jpg",
		},
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
);

// Create a slug from the name before saving
BootcampSchema.pre("save", function (next) {
	this.slug = this.name
		.toLowerCase()
		.replace(/ /g, "-")
		.replace(/[^\w-]+/g, "");

	// Adjust the address field based on onlineAvailable
	if (this.onlineAvailable) {
		this.address = undefined; // Ensure address is removed if onlineAvailable is true
		this.electronicMedium = this.electronicMedium || "zoom"; // Set default if needed
		this.mediumLink = this.mediumLink || ""; // Default to empty string if needed
	} else {
		if (!this.address || this.address.trim().length === 0) {
			return next(
				new Error("Address is required if the bootcamp is not online")
			);
		}
		this.electronicMedium = undefined;
		this.mediumLink = undefined;
	}

	// Pre-save hook to calculate and set endDate
	if (this.startDate && this.duration) {
		this.endDate = new Date(this.startDate);
		this.endDate.setDate(this.endDate.getDate() + this.duration * 7);
	}

	next();
});

// Reverse populate with virtuals
BootcampSchema.virtual("courses", {
	ref: "Course",
	localField: "_id",
	foreignField: "bootcamp",
	justOne: false,
});

// Cascade delete courses when a bootcamp is deleted
BootcampSchema.pre(
	"deleteOne",
	{ document: true, query: false },
	async function (next) {
		console.log(`Courses being removed from bootcamp ${this._id}`);
		await this.model("Course").deleteMany({ bootcamp: this._id });
		next();
	}
);

BootcampSchema.statics.calculateAverageRating = async function (bootcampId) {
	const obj = await this.aggregate([
		{ $match: { _id: bootcampId } },
		{
			$lookup: {
				from: "reviews",
				localField: "_id",
				foreignField: "bootcamp",
				as: "reviews",
			},
		},
		{ $unwind: "$reviews" },
		{
			$group: {
				_id: "$_id",
				averageRating: { $avg: "$reviews.rating" },
			},
		},
	]);

	try {
		await this.model("Bootcamp").findByIdAndUpdate(bootcampId, {
			averageRating: obj[0] ? obj[0].averageRating : 0,
		});
	} catch (err) {
		console.error(err);
	}
};

// Create the Bootcamp model from the schema
const Bootcamp = mongoose.model("Bootcamp", BootcampSchema);

module.exports = Bootcamp;
