const InventoryOrder = require('../models/InventoryOrder');
const Inventory = require('../models/Inventory');

const normalizeStatus = (status) => {
    const s = String(status || '').toLowerCase();
    if (!s) return 'ordered';
    if (s === 'processing') return 'ordered';
    if (s === 'received') return 'delivered';
    return s;
};

exports.getAllOrders = async (req, res, next) => {
    try {
        const { status, supplierId, search } = req.query;
        const query = {};
        if (status) query.status = normalizeStatus(status);
        if (supplierId) query.supplier = supplierId;
        if (search) {
            const q = String(search).trim();
            query.$or = [
                { orderNumber: { $regex: q, $options: 'i' } },
            ];
        }

        const orders = await InventoryOrder.find(query)
            .populate('supplier', 'name phone email')
            .sort({ createdAt: -1 });

        res.status(200).json({ status: 'success', data: { orders } });
    } catch (error) {
        next(error);
    }
};

exports.getOrderById = async (req, res, next) => {
    try {
        const order = await InventoryOrder.findById(req.params.id)
            .populate('supplier')
            .populate('items.inventoryItem');
        if (!order) return res.status(404).json({ status: 'error', message: 'Not found' });
        res.status(200).json({ status: 'success', data: { order } });
    } catch (error) {
        next(error);
    }
};

exports.createOrder = async (req, res, next) => {
    try {
        const body = req.body || {};
        const supplier = body.supplier;
        const status = normalizeStatus(body.status || 'ordered');
        const orderDate = body.orderDate ? new Date(body.orderDate) : new Date();
        const expectedDate = body.expectedDate ? new Date(body.expectedDate) : undefined;

        const items = Array.isArray(body.items) ? body.items : [];
        if (!supplier) {
            return res.status(400).json({ status: 'error', message: 'supplier is required' });
        }
        if (!items.length) {
            return res.status(400).json({ status: 'error', message: 'At least one item is required' });
        }

        const normalizedItems = items.map((it) => ({
            inventoryItem: it.inventoryItem,
            name: String(it.name || '').trim() || undefined,
            quantity: Number(it.quantity),
            unitCost: Number(it.unitCost),
            total: 0,
        }));

        const order = await InventoryOrder.create({
            supplier,
            status,
            orderDate,
            expectedDate,
            items: normalizedItems,
            notes: body.notes,
        });

        const populated = await InventoryOrder.findById(order._id).populate('supplier', 'name');
        res.status(201).json({ status: 'success', data: { order: populated } });
    } catch (error) {
        next(error);
    }
};

exports.updateOrder = async (req, res, next) => {
    try {
        const body = req.body || {};
        const patch = { ...body };
        if (patch.status) patch.status = normalizeStatus(patch.status);

        if (patch.items !== undefined) {
            const items = Array.isArray(patch.items) ? patch.items : [];
            patch.items = items.map((it) => ({
                inventoryItem: it.inventoryItem,
                name: String(it.name || '').trim() || undefined,
                quantity: Number(it.quantity),
                unitCost: Number(it.unitCost),
                total: 0,
            }));
        }

        const order = await InventoryOrder.findByIdAndUpdate(req.params.id, patch, {
            new: true,
            runValidators: true,
        }).populate('supplier', 'name');

        if (!order) return res.status(404).json({ status: 'error', message: 'Not found' });
        res.status(200).json({ status: 'success', data: { order } });
    } catch (error) {
        next(error);
    }
};

exports.deleteOrder = async (req, res, next) => {
    try {
        const order = await InventoryOrder.findByIdAndDelete(req.params.id);
        if (!order) return res.status(404).json({ status: 'error', message: 'Not found' });
        res.status(200).json({ status: 'success', message: 'Deleted' });
    } catch (error) {
        next(error);
    }
};

exports.receiveOrder = async (req, res, next) => {
    try {
        const order = await InventoryOrder.findById(req.params.id);
        if (!order) return res.status(404).json({ status: 'error', message: 'Not found' });

        if (order.status === 'delivered') {
            const populated = await InventoryOrder.findById(order._id).populate('supplier', 'name');
            return res.status(200).json({ status: 'success', data: { order: populated } });
        }

        const items = Array.isArray(order.items) ? order.items : [];
        for (const it of items) {
            const invId = it.inventoryItem;
            const qty = Number(it.quantity || 0);
            if (!invId || !Number.isFinite(qty) || qty <= 0) continue;

            await Inventory.findByIdAndUpdate(invId, {
                $inc: { quantity: qty },
                $set: { lastRestocked: new Date() },
            });
        }

        order.status = 'delivered';
        order.receivedDate = new Date();
        await order.save();

        const populated = await InventoryOrder.findById(order._id).populate('supplier', 'name');
        res.status(200).json({ status: 'success', data: { order: populated } });
    } catch (error) {
        next(error);
    }
};
