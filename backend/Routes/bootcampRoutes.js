const express = require("express");
const router = express.Router();
const {
	getBootcamps,
	getSingleBootcamp,
	createBootcamp,
	updateBootcamp,
	deleteBootcamp,
	uploadBootcampPhoto,
	getUserBootcamps,
} = require("../Controllers/bootcampControllers");
const {
	validateToken,
	authorizeRoles,
} = require("../middleware/authMiddleware");

// Include other resource routers
const courseRouter = require("./courseRoutes");
const reviewRouter = require("./reviewRoutes");

// Re-route into other resource routers
router.use("/:bootcampId/courses", courseRouter);
router.use("/:bootcampId/reviews", reviewRouter);

router
	.route("/")
	.get(getBootcamps)
	.post(validateToken, authorizeRoles("admin", "moderator"), createBootcamp);

router
	.route("/user")
	.get(validateToken, authorizeRoles("admin", "moderator"), getUserBootcamps);

router
	.route("/:id")
	.get(getSingleBootcamp)
	.put(validateToken, authorizeRoles("admin", "moderator"), updateBootcamp)
	.delete(
		validateToken,
		authorizeRoles("admin", "moderator"),
		deleteBootcamp
	);

router
	.route("/:id/photo")
	.put(
		validateToken,
		authorizeRoles("admin", "moderator"),
		uploadBootcampPhoto
	);

module.exports = router;
