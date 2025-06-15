// server/routes/adminUsers.js
const router = require('express').Router();
const adminUsersController = require('../controllers/adminUsers');
const authMiddleware = require('../middlewares/auth');

// Protect all routes in this file - only for 'admin' role
router.use(authMiddleware(['admin']));

router.get('/', adminUsersController.getAllUsers);          // GET /api/admin/users (list users)
router.get('/:userId', adminUsersController.getUserById);   // GET /api/admin/users/123 (get specific user for edit form)
router.put('/:userId', adminUsersController.updateUserByAdmin); // PUT /api/admin/users/123 (update user)
router.delete('/:userId', adminUsersController.deleteUserByAdmin); // DELETE /api/admin/users/123 (delete user)

module.exports = router;