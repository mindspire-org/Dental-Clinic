const Inventory = require('../models/Inventory');

exports.getAllInventory = async (req, res, next) => {
    try {
        const items = await Inventory.find().sort('itemName');
        res.status(200).json({ status: 'success', data: { items } });
    } catch (error) { next(error); }
};

exports.getInventoryById = async (req, res, next) => {
    try {
        const item = await Inventory.findById(req.params.id);
        if (!item) return res.status(404).json({ status: 'error', message: 'Not found' });
        res.status(200).json({ status: 'success', data: { item } });
    } catch (error) { next(error); }
};

exports.getLowStockItems = async (req, res, next) => {
    try {
        const items = await Inventory.find({ $expr: { $lte: ['$quantity', '$minQuantity'] } });
        res.status(200).json({ status: 'success', data: { items } });
    } catch (error) { next(error); }
};

exports.createInventoryItem = async (req, res, next) => {
    try {
        const item = await Inventory.create(req.body);
        res.status(201).json({ status: 'success', data: { item } });
    } catch (error) { next(error); }
};

exports.updateInventoryItem = async (req, res, next) => {
    try {
        const item = await Inventory.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({ status: 'success', data: { item } });
    } catch (error) { next(error); }
};

exports.deleteInventoryItem = async (req, res, next) => {
    try {
        await Inventory.findByIdAndDelete(req.params.id);
        res.status(200).json({ status: 'success', message: 'Deleted' });
    } catch (error) { next(error); }
};
