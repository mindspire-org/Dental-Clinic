const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const inventorySuppliersController = require('../controllers/inventorySuppliersController');
const inventoryOrdersController = require('../controllers/inventoryOrdersController');

router.get('/', inventoryController.getAllInventory);
router.get('/low-stock', inventoryController.getLowStockItems);

// Suppliers
router.get('/suppliers', inventorySuppliersController.getAllSuppliers);
router.get('/suppliers/:id', inventorySuppliersController.getSupplierById);
router.post('/suppliers', inventorySuppliersController.createSupplier);
router.put('/suppliers/:id', inventorySuppliersController.updateSupplier);
router.delete('/suppliers/:id', inventorySuppliersController.deleteSupplier);

// Orders
router.get('/orders', inventoryOrdersController.getAllOrders);
router.get('/orders/:id', inventoryOrdersController.getOrderById);
router.post('/orders', inventoryOrdersController.createOrder);
router.put('/orders/:id', inventoryOrdersController.updateOrder);
router.delete('/orders/:id', inventoryOrdersController.deleteOrder);
router.post('/orders/:id/receive', inventoryOrdersController.receiveOrder);

// Items
router.get('/:id', inventoryController.getInventoryById);
router.post('/', inventoryController.createInventoryItem);
router.put('/:id', inventoryController.updateInventoryItem);
router.delete('/:id', inventoryController.deleteInventoryItem);

module.exports = router;
