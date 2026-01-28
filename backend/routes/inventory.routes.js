const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const auth = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');

router.use(auth);
router.use(authorize('admin'));

router.get('/', inventoryController.getAllInventory);
router.get('/low-stock', inventoryController.getLowStockItems);
router.get('/:id', inventoryController.getInventoryById);
router.post('/', inventoryController.createInventoryItem);
router.put('/:id', inventoryController.updateInventoryItem);
router.delete('/:id', inventoryController.deleteInventoryItem);

module.exports = router;
