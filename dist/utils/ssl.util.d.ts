export interface SSLConfig {
    certPath: string;
    keyPath: string;
}
export declare function ensureSSLCertificate(certPath: string, keyPath: string): Promise<SSLConfig>;
export declare function checkOpenSSLAvailable(): Promise<boolean>;
