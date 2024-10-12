const express = require("express");
const {
	getAllCourses,
	createCourse,
	getSingleCourse,
	updateExistingCourse,
	deleteCourse,
	getUserCourses,
} = require("../Controllers/courseController");
const {
	validateToken,
	authorizeRoles,
} = require("../middleware/authMiddleware");

const router = express.Router({ mergeParams: true });

router.route("/").get(getAllCourses).post(validateToken, createCourse);

router
	.route("/user")
	.get(validateToken, authorizeRoles("admin", "moderator"), getUserCourses);

router
	.route("/:id")
	.get(getSingleCourse)
	.put(validateToken, updateExistingCourse)
	.delete(validateToken, deleteCourse);

module.exports = router;
