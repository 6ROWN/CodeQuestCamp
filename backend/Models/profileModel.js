const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema(
	{
		firstname: {
			type: String,
			required: true,
			trim: true,
		},
		lastname: {
			type: String,
			required: true,
			trim: true,
		},
		gender: {
			type: String,
			enum: ["male", "female"],
			required: true,
		},
		phone: {
			type: String,
			required: true,
			trim: true,
		},
		country: {
			type: String,
			required: true,
		},
	},
	{
		timestamps: true,
	}
);

module.exports = mongoose.model("Profile", profileSchema);
