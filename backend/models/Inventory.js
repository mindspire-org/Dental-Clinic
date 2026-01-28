const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
    itemName: {
        type: String,
        required: [true, 'Item name is required'],
        trim: true,
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: [
            'instruments',
            'materials',
            'medications',
            'supplies',
            'equipment',
            'consumables',
            'other'
        ],
    },
    sku: {
        type: String,
        unique: true,
        trim: true,
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: 0,
    },
    minQuantity: {
        type: Number,
        default: 10,
        min: 0,
    },
    unit: {
        type: String,
        required: [true, 'Unit is required'],
        enum: ['piece', 'box', 'bottle', 'pack', 'kg', 'liter', 'other'],
    },
    supplier: {
        name: String,
        contact: String,
        email: String,
        phone: String,
    },
    cost: {
        type: Number,
        min: 0,
    },
    lastRestocked: Date,
    expiryDate: Date,
    location: String,
    notes: String,
}, {
    timestamps: true,
});

// Auto-generate SKU if not provided
inventorySchema.pre('save', async function (next) {
    if (!this.sku) {
        const count = await mongoose.model('Inventory').countDocuments();
        this.sku = `SKU${String(count + 1).padStart(6, '0')}`;
    }
    next();
});

// Virtual for low stock alert
inventorySchema.virtual('isLowStock').get(function () {
    return this.quantity <= this.minQuantity;
});

// Index for queries
inventorySchema.index({ itemName: 'text', category: 'text' });
inventorySchema.index({ category: 1 });
inventorySchema.index({ sku: 1 });

module.exports = mongoose.model('Inventory', inventorySchema);
