const express = require("express");
const {
	loginUser,
	registerUser,
	getCurrentUser,
	forgotPassword,
	resetPassword,
	updatePassword,
	changeUserRole,
} = require("../Controllers/userController");
const {
	validateToken,
	authorizeRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Define routes
router.post("/login", loginUser);
router.post("/register", registerUser);
router.post("/forgotpassword", forgotPassword); // Add forgot password route
router.put("/resetpassword/:resetToken", resetPassword); // Add reset password route
router.get("/me", validateToken, getCurrentUser); // Protect the route with validateToken middleware
router.put("/updatepassword", validateToken, updatePassword);
router.put("/:id/role", validateToken, authorizeRoles("admin"), changeUserRole); // Define route for changing user role

module.exports = router;
