import { fromByteArray, toByteArray } from "base64-js";
export const uriSkynetPrefix = "sia://";
/**
 * Encodes the bytes to a string encoded using base64 raw URL encoding.
 *
 * @param bytes - The bytes to encode.
 * @returns - The encoded string.
 */
export function uint8ArrayToBase64RawUrl(bytes: Uint8Array): string {
    let base64 = fromByteArray(bytes);
    // Convert to URL encoding.
    base64 = base64.replace(/\+/g, "-").replace(/\//g, "_");
    return base64;
}
/**
 * Decodes the string encoded using base64 raw URL encoding to bytes.
 *
 * @param s - The encoded string.
 * @returns - The decoded bytes.
 */
export function base64RawUrlToUint8Array(s: string): Uint8Array {
    // Convert from URL encoding.
    s = s.replace(/-/g, "+").replace(/_/g, "/");
    const bytes = toByteArray(s);
    return bytes;
}
// TODO: Move to mysky-utils
/**
 * Removes a suffix from the end of the string.
 *
 * @param str - The string to process.
 * @param suffix - The suffix to remove.
 * @param [limit] - Maximum amount of times to trim. No limit by default.
 * @returns - The processed string.
 */
export function trimSuffix(str: string, suffix: string, limit?: number): string {
    while (str.endsWith(suffix)) {
        if (limit !== undefined && limit <= 0) {
            break;
        }
        str = str.substring(0, str.length - suffix.length);
        if (limit) {
            limit -= 1;
        }
    }
    return str;
}
/**
 * Removes a URI prefix from the beginning of the string.
 *
 * @param str - The string to process.
 * @param prefix - The prefix to remove.
 * @returns - The processed string.
 */
export function trimUriPrefix(str: string, prefix: string): string {
    const shortPrefix = trimSuffix(prefix, "/");
    if (str.startsWith(prefix)) {
        // longPrefix is exactly at the beginning
        return str.slice(prefix.length);
    }
    if (str.startsWith(shortPrefix)) {
        // else prefix is exactly at the beginning
        return str.slice(shortPrefix.length);
    }
    return str;
}