import { customType } from "drizzle-orm/pg-core";

/**
 * Custom hex type that matches Ponder's hex() behavior.
 * Stores as text in PostgreSQL, maps to `0x${string}` in TypeScript.
 */
export const hex = customType<{ data: `0x${string}`; driverData: string }>({
  dataType() {
    return "text";
  },
  fromDriver(value: string): `0x${string}` {
    return value as `0x${string}`;
  },
  toDriver(value: `0x${string}`): string {
    // Normalize: lowercase and pad odd-length hex
    if (value.length % 2 === 0) return value.toLowerCase();
    return `0x0${value.slice(2)}`.toLowerCase();
  },
});

/**
 * Custom bigint type that maps to JavaScript bigint (like Ponder's bigint).
 * Uses numeric(78, 0) to support Ethereum uint256 values.
 */
export const bigint = customType<{ data: bigint; driverData: string }>({
  dataType() {
    return "numeric(78, 0)";
  },
  fromDriver(value: string): bigint {
    return BigInt(value);
  },
  toDriver(value: bigint): string {
    return value.toString();
  },
});
