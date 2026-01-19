import { formatEther } from "viem";

/**
 * Format a bigint wei value to a readable ETH string
 */
export function formatEth(wei: bigint): string {
  const eth = formatEther(wei);
  // Parse and format to avoid excessive decimals
  const num = parseFloat(eth);
  if (num === 0) return "0";
  if (num < 0.001) return "<0.001";
  if (num >= 1000) return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (num >= 1) return num.toLocaleString(undefined, { maximumFractionDigits: 4 });
  return num.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

/**
 * Truncate an address to a readable short form
 */
export function formatAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
