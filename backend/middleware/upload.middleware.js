const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dest = path.join(__dirname, '..', '..', process.env.UPLOAD_PATH || 'uploads');
        try {
            fs.mkdirSync(dest, { recursive: true });
        } catch {
            // ignore
        }
        cb(null, dest);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

// File filter
const fileFilter = (req, file, cb) => {
    // Allow images, pdfs, docs
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Only images and document files are allowed!'));
    }
};

const upload = multer({
    storage,
    limits: {
        fileSize: Number(process.env.MAX_FILE_SIZE) || 10485760, // 10MB
    },
    fileFilter,
});

module.exports = upload;
