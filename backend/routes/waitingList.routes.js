const express = require('express');
const router = express.Router();
const waitingListController = require('../controllers/waitingListController');

router.get('/', waitingListController.getWaitingList);
router.post('/', waitingListController.createWaitingItem);
router.put('/:id', waitingListController.updateWaitingItem);
router.delete('/:id', waitingListController.deleteWaitingItem);

module.exports = router;
