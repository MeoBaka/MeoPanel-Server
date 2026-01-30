"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureSSLCertificate = ensureSSLCertificate;
exports.checkOpenSSLAvailable = checkOpenSSLAvailable;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const selfsigned_1 = __importDefault(require("selfsigned"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
async function ensureSSLCertificate(certPath, keyPath) {
    const certDir = path.dirname(certPath);
    if (!fs.existsSync(certDir)) {
        fs.mkdirSync(certDir, { recursive: true });
    }
    if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
        console.log('✓ SSL certificates already exist');
        return { certPath, keyPath };
    }
    console.log('⚠ SSL certificates not found, generating self-signed certificates...');
    try {
        const opensslAvailable = await checkOpenSSLAvailable();
        if (opensslAvailable) {
            await generateWithOpenSSL(certPath, keyPath);
        }
        else {
            await generateWithSelfsigned(certPath, keyPath);
        }
        console.log('✓ Self-signed SSL certificates generated successfully');
        console.log(`  Certificate: ${certPath}`);
        console.log(`  Private Key: ${keyPath}`);
        console.log('⚠ Note: This is a self-signed certificate. Browsers will show a security warning.');
        return { certPath, keyPath };
    }
    catch (error) {
        console.error('✗ Failed to generate SSL certificates:', error);
        throw new Error(`Failed to generate SSL certificates: ${error}`);
    }
}
async function generateWithOpenSSL(certPath, keyPath) {
    const subject = '/C=VN/ST=HoChiMinh/L=HoChiMinh/O=MeoPanel/OU=Development/CN=localhost';
    const command = `openssl req -x509 -newkey rsa:4096 -keyout "${keyPath}" -out "${certPath}" -days 365 -nodes -subj "${subject}"`;
    await execAsync(command);
}
async function generateWithSelfsigned(certPath, keyPath) {
    console.log('ℹ Using selfsigned library to generate certificates...');
    const attrs = [{ name: 'commonName', value: 'localhost' }];
    const pems = await selfsigned_1.default.generate(attrs, {
        keySize: 2048,
        algorithm: 'sha256',
        extensions: [
            {
                name: 'basicConstraints',
                cA: true,
            },
            {
                name: 'keyUsage',
                keyCertSign: true,
                digitalSignature: true,
                nonRepudiation: true,
                keyEncipherment: true,
                dataEncipherment: true,
            },
            {
                name: 'extKeyUsage',
                serverAuth: true,
                clientAuth: true,
            },
            {
                name: 'subjectAltName',
                altNames: [
                    { type: 2, value: 'localhost' },
                    { type: 2, value: '127.0.0.1' },
                    { type: 7, ip: '127.0.0.1' },
                    { type: 7, ip: '::1' },
                ],
            },
        ],
    });
    fs.writeFileSync(keyPath, pems.private);
    fs.writeFileSync(certPath, pems.cert);
}
async function checkOpenSSLAvailable() {
    try {
        await execAsync('openssl version');
        return true;
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=ssl.util.js.map