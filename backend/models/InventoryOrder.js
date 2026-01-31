const mongoose = require('mongoose');

const inventoryOrderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        unique: true,
        index: true,
    },
    supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier',
        required: true,
        index: true,
    },
    status: {
        type: String,
        enum: ['draft', 'ordered', 'shipped', 'delivered', 'cancelled'],
        default: 'ordered',
        index: true,
    },
    orderDate: {
        type: Date,
        default: Date.now,
        index: true,
    },
    expectedDate: Date,
    receivedDate: Date,
    items: [
        {
            inventoryItem: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Inventory',
                required: true,
            },
            name: {
                type: String,
                trim: true,
            },
            quantity: {
                type: Number,
                required: true,
                min: 1,
            },
            unitCost: {
                type: Number,
                required: true,
                min: 0,
            },
            total: {
                type: Number,
                required: true,
                min: 0,
            },
        },
    ],
    subtotal: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
    },
    notes: String,
}, {
    timestamps: true,
});

inventoryOrderSchema.pre('validate', async function (next) {
    try {
        if (!this.orderNumber) {
            const count = await mongoose.model('InventoryOrder').countDocuments();
            const date = new Date();
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            this.orderNumber = `PO${year}${month}${String(count + 1).padStart(4, '0')}`;
        }

        const items = Array.isArray(this.items) ? this.items : [];
        let subtotal = 0;
        items.forEach((it) => {
            const qty = Number(it.quantity || 0);
            const unit = Number(it.unitCost || 0);
            const total = Math.max(0, qty * unit);
            it.total = total;
            subtotal += total;
        });
        this.subtotal = Math.max(0, subtotal);
        next();
    } catch (e) {
        next(e);
    }
});

inventoryOrderSchema.index({ supplier: 1, createdAt: -1 });

module.exports = mongoose.model('InventoryOrder', inventoryOrderSchema);
