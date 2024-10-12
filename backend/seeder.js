const fs = require("node:fs");
const mongoose = require("mongoose");
const colors = require("colors");
const dotenv = require("dotenv");

//Load dotenv file
dotenv.config();

//Load models
const Bootcamp = require("./Models/bootcampModel");
const Course = require("./Models/courseModel");

//Connect to DB
mongoose.connect(process.env.MONGODB_STRING);

//Read JSON file to be imported
const bootcamps = JSON.parse(
	fs.readFileSync(`${__dirname}/_data/bootcamp.json`, "utf-8")
);
const courses = JSON.parse(
	fs.readFileSync(`${__dirname}/_data/courses.json`, "utf-8")
);

//Import file into DB
const importDB = async () => {
	try {
		await Bootcamp.create(bootcamps);
		await Course.create(courses);
		console.log("Data imported successfully".green.inverse);
		process.exit();
	} catch (error) {
		console.error(error);
	}
};

//Delete file from DB
const deleteDB = async () => {
	try {
		await Bootcamp.deleteMany();
		await Course.deleteMany();
		console.log("Data destroyed!!!".red.inverse);
		process.exit();
	} catch (error) {
		console.error(error);
	}
};

if (process.argv[2] === "-i") {
	importDB();
} else if (process.argv[2] === "-d") {
	deleteDB();
}
