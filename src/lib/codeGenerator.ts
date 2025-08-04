export class CodeGenerator {
    /**
     * Returns a random 6-digit numerical code as a string
     * (e.g., "483920").
     */
    public static getCode(): number {
        // Ensures leading zeros are preserved
        return Math.floor(100000 + Math.random() * 900000);
    }

    /**
     * Returns a GUID-like string (UUID v4 style).
     * Example: "3f2504e0-4f89-41d3-9a0c-0305e82c3301"
     */
    public static getToken(): string {
        // Generate RFC4122 version 4 UUID
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }
}