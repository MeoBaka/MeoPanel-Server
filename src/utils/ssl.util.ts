import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import selfsigned from 'selfsigned';

const execAsync = promisify(exec);

export interface SSLConfig {
  certPath: string;
  keyPath: string;
}

/**
 * Tự động tạo self-signed certificate nếu chưa tồn tại
 */
export async function ensureSSLCertificate(
  certPath: string,
  keyPath: string,
): Promise<SSLConfig> {
  const certDir = path.dirname(certPath);
  
  // Tạo thư mục certs nếu chưa tồn tại
  if (!fs.existsSync(certDir)) {
    fs.mkdirSync(certDir, { recursive: true });
  }

  // Kiểm tra xem certificate đã tồn tại chưa
  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    console.log('✓ SSL certificates already exist');
    return { certPath, keyPath };
  }

  console.log('⚠ SSL certificates not found, generating self-signed certificates...');

  try {
    // Thử sử dụng OpenSSL trước (nếu có sẵn)
    const opensslAvailable = await checkOpenSSLAvailable();
    
    if (opensslAvailable) {
      await generateWithOpenSSL(certPath, keyPath);
    } else {
      // Fallback sang selfsigned library
      await generateWithSelfsigned(certPath, keyPath);
    }
    
    console.log('✓ Self-signed SSL certificates generated successfully');
    console.log(`  Certificate: ${certPath}`);
    console.log(`  Private Key: ${keyPath}`);
    console.log('⚠ Note: This is a self-signed certificate. Browsers will show a security warning.');
    
    return { certPath, keyPath };
  } catch (error) {
    console.error('✗ Failed to generate SSL certificates:', error);
    throw new Error(`Failed to generate SSL certificates: ${error}`);
  }
}

/**
 * Tạo certificate sử dụng OpenSSL
 */
async function generateWithOpenSSL(certPath: string, keyPath: string): Promise<void> {
  const subject = '/C=VN/ST=HoChiMinh/L=HoChiMinh/O=MeoPanel/OU=Development/CN=localhost';
  const command = `openssl req -x509 -newkey rsa:4096 -keyout "${keyPath}" -out "${certPath}" -days 365 -nodes -subj "${subject}"`;
  await execAsync(command);
}

/**
 * Tạo certificate sử dụng selfsigned library (không cần OpenSSL)
 */
async function generateWithSelfsigned(certPath: string, keyPath: string): Promise<void> {
  console.log('ℹ Using selfsigned library to generate certificates...');
  
  const attrs = [{ name: 'commonName', value: 'localhost' }];
  const pems = await selfsigned.generate(attrs, {
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

  // Ghi file
  fs.writeFileSync(keyPath, pems.private);
  fs.writeFileSync(certPath, pems.cert);
}

/**
 * Kiểm tra xem OpenSSL có sẵn không
 */
export async function checkOpenSSLAvailable(): Promise<boolean> {
  try {
    await execAsync('openssl version');
    return true;
  } catch {
    return false;
  }
}
