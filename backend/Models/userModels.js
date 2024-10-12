const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema(
	{
		username: {
			type: String,
			required: [true, "Username is required"],
			unique: true,
			minlength: [3, "Username must be at least 3 characters long"],
		},
		email: {
			type: String,
			required: true,
			unique: true,
			match: [/^\S+@\S+\.\S+$/, "Please use a valid email address."],
		},
		password: {
			type: String,
			required: true,
			minlength: 6,
		},

		roles: {
			type: String,
			enum: ["user", "admin", "moderator"], // Add your specific roles here
			default: "user", // Default role
		},
		resetPasswordToken: String,
		resetPasswordExpires: Date,
		profile: {
			type: Schema.Types.ObjectId,
			ref: "Profile",
			//required: true,
		},
	},
	{ timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = User;

// const testPopulation = async () => {
// 	try {
// 		const users = await User.find()
// 			.populate({
// 				path: "profile",
// 				select: "firstname lastname",
// 			})
// 			.exec();

// 		console.log(users);
// 	} catch (err) {
// 		console.error(err);
// 	} finally {
// 		mongoose.connection.close();
// 	}
// };

// testPopulation();
