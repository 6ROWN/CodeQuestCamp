const express = require("express");
const router = express.Router();
const {
	getUsers,
	getSingleUser,
	createUser,
	updateUser,
	deleteUser,
} = require("../Controllers/userAdminController");
const {
	validateToken,
	authorizeRoles,
} = require("../middleware/authMiddleware");

// Apply middleware to all routes
router.use(validateToken);
router.use(authorizeRoles("admin"));

// Define routes
router
	.route("/")
	.get(getUsers) // GET all users
	.post(createUser); // CREATE a new user

router
	.route("/:id")
	.get(getSingleUser) // GET a single user by ID
	.put(updateUser) // UPDATE a user by ID
	.delete(deleteUser); // DELETE a user by ID

module.exports = router;
