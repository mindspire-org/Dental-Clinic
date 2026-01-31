const Inventory = require('../models/Inventory');

const mapUnitToUi = (unit) => {
    const u = String(unit || '').toLowerCase();
    if (u === 'piece') return 'pcs';
    return u || 'other';
};

const mapUnitToDb = (unit) => {
    const u = String(unit || '').toLowerCase();
    if (u === 'pcs' || u === 'pieces') return 'piece';
    return u || 'other';
};

const mapInventoryItem = (item) => {
    if (!item) return item;
    return {
        _id: item._id,
        name: item.itemName,
        category: item.category,
        quantity: Number(item.quantity || 0),
        unit: mapUnitToUi(item.unit),
        reorderLevel: Number(item.minQuantity || 0),
        price: Number(item.cost || 0),
        supplier: String(item?.supplier?.name || '').trim() || undefined,
        supplierContact: String(item?.supplier?.contact || '').trim() || undefined,
        supplierEmail: String(item?.supplier?.email || '').trim() || undefined,
        supplierPhone: String(item?.supplier?.phone || '').trim() || undefined,
        sku: item.sku,
        location: item.location,
        expiryDate: item.expiryDate,
        lastRestocked: item.lastRestocked,
        notes: item.notes,
        updatedAt: item.updatedAt,
        createdAt: item.createdAt,
    };
};

const normalizeSupplier = (supplier) => {
    if (!supplier) return undefined;
    if (typeof supplier === 'string') {
        const name = String(supplier).trim();
        return name ? { name } : undefined;
    }
    if (typeof supplier === 'object') {
        const name = String(supplier.name || '').trim();
        const phone = String(supplier.phone || '').trim();
        const email = String(supplier.email || '').trim();
        const contact = String(supplier.contact || supplier.contactPerson || '').trim();
        if (!name && !phone && !email && !contact) return undefined;
        return {
            name: name || undefined,
            phone: phone || undefined,
            email: email || undefined,
            contact: contact || undefined,
        };
    }
    return undefined;
};

const normalizeInventoryPayload = (body) => {
    const b = body || {};
    const itemName = String(b.itemName || b.name || '').trim();
    const category = String(b.category || '').trim();
    const quantity = Number(b.quantity);
    const minQuantity = Number(b.minQuantity ?? b.reorderLevel);
    const cost = Number(b.cost ?? b.price);
    const unit = mapUnitToDb(b.unit);
    const supplier = normalizeSupplier(b.supplier ?? {
        name: b.supplier,
        contact: b.supplierContact,
        email: b.supplierEmail,
        phone: b.supplierPhone,
    });
    const sku = b.sku ? String(b.sku).trim() : undefined;
    const location = b.location ? String(b.location).trim() : undefined;
    const notes = b.notes ? String(b.notes) : undefined;

    const expiryDate = b.expiryDate ? new Date(b.expiryDate) : undefined;
    const lastRestocked = b.lastRestocked ? new Date(b.lastRestocked) : undefined;

    const payload = {
        itemName: itemName || undefined,
        category: category || undefined,
        quantity: Number.isFinite(quantity) ? quantity : undefined,
        minQuantity: Number.isFinite(minQuantity) ? minQuantity : undefined,
        unit: unit || undefined,
        cost: Number.isFinite(cost) ? cost : undefined,
        supplier: supplier || undefined,
        sku,
        location,
        expiryDate: expiryDate && !Number.isNaN(expiryDate.getTime()) ? expiryDate : undefined,
        lastRestocked: lastRestocked && !Number.isNaN(lastRestocked.getTime()) ? lastRestocked : undefined,
        notes,
    };

    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
    return payload;
};

exports.getAllInventory = async (req, res, next) => {
    try {
        const items = await Inventory.find().sort('itemName');
        res.status(200).json({ status: 'success', data: { items: items.map(mapInventoryItem) } });
    } catch (error) { next(error); }
};

exports.getInventoryById = async (req, res, next) => {
    try {
        const item = await Inventory.findById(req.params.id);
        if (!item) return res.status(404).json({ status: 'error', message: 'Not found' });
        res.status(200).json({ status: 'success', data: { item: mapInventoryItem(item) } });
    } catch (error) { next(error); }
};

exports.getLowStockItems = async (req, res, next) => {
    try {
        const items = await Inventory.find({ $expr: { $lte: ['$quantity', '$minQuantity'] } });
        res.status(200).json({ status: 'success', data: { items: items.map(mapInventoryItem) } });
    } catch (error) { next(error); }
};

exports.createInventoryItem = async (req, res, next) => {
    try {
        const payload = normalizeInventoryPayload(req.body);
        const item = await Inventory.create(payload);
        res.status(201).json({ status: 'success', data: { item: mapInventoryItem(item) } });
    } catch (error) { next(error); }
};

exports.updateInventoryItem = async (req, res, next) => {
    try {
        const payload = normalizeInventoryPayload(req.body);
        const item = await Inventory.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
        if (!item) return res.status(404).json({ status: 'error', message: 'Not found' });
        res.status(200).json({ status: 'success', data: { item: mapInventoryItem(item) } });
    } catch (error) { next(error); }
};

exports.deleteInventoryItem = async (req, res, next) => {
    try {
        await Inventory.findByIdAndDelete(req.params.id);
        res.status(200).json({ status: 'success', message: 'Deleted' });
    } catch (error) { next(error); }
};
