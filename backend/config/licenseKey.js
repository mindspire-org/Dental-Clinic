const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const envPath = path.join(__dirname, '..', '.env');

const generateKey = () => {
    return crypto.randomBytes(24).toString('hex').toUpperCase();
};

const ensureLicenseKey = () => {
    if (process.env.LICENSE_KEY) return process.env.LICENSE_KEY;

    const key = generateKey();
    process.env.LICENSE_KEY = key;

    try {
        let contents = '';
        if (fs.existsSync(envPath)) {
            contents = fs.readFileSync(envPath, 'utf8');
        }

        if (!/^LICENSE_KEY=/m.test(contents)) {
            const prefix = contents && !contents.endsWith('\n') ? '\n' : '';
            fs.writeFileSync(envPath, `${contents}${prefix}LICENSE_KEY=${key}\n`, 'utf8');
        }
    } catch (e) {
        // best-effort; keep running even if file write fails
    }

    return key;
};

const persistLicenseKey = (key) => {
    if (!key) return;
    process.env.LICENSE_KEY = key;

    try {
        let contents = '';
        if (fs.existsSync(envPath)) {
            contents = fs.readFileSync(envPath, 'utf8');
        }

        if (/^LICENSE_KEY=/m.test(contents)) {
            contents = contents.replace(/^LICENSE_KEY=.*$/m, `LICENSE_KEY=${key}`);
        } else {
            const prefix = contents && !contents.endsWith('\n') ? '\n' : '';
            contents = `${contents}${prefix}LICENSE_KEY=${key}\n`;
        }
        fs.writeFileSync(envPath, contents, 'utf8');
    } catch (e) {
        // best-effort
    }
};

module.exports = { ensureLicenseKey, persistLicenseKey };
