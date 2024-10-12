const mongoose = require("mongoose");

const connectDB = async () => {
	try {
		const conn = await mongoose.connect(process.env.MONGODB_STRING);
		console.log(
			`MONGODB CONNECTION STARTED on ${conn.connection.host}`.cyan
				.underline
		);
	} catch (error) {
		console.log(error);
		process.exit(1);
	}
};

module.exports = connectDB;
