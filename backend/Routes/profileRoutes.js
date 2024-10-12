const express = require("express");
const router = express.Router();
const {
	getProfileByUserId,
	createProfile,
	updateProfile,
} = require("../Controllers/profileController");
const { validateToken } = require("../middleware/authMiddleware");

// Apply middleware to all routes in this router
router.use(validateToken);

router
	.route("/")
	.get(getProfileByUserId)
	.post(createProfile)
	.put(updateProfile);

module.exports = router;
