export interface CurrencyOption {
  code: string;
  symbol: string;
  label: string;
  display: string;
}

export const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  { code: 'INR', symbol: '₹', label: 'Indian Rupee', display: '₹ INR' },
  { code: 'USD', symbol: '$', label: 'US Dollar', display: '$ USD' },
  { code: 'EUR', symbol: '€', label: 'Euro', display: '€ EUR' },
  { code: 'GBP', symbol: '£', label: 'British Pound', display: '£ GBP' },
  { code: 'BDT', symbol: '৳', label: 'Bangladeshi Taka', display: '৳ BDT' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen', display: '¥ JPY' },
  { code: 'AED', symbol: 'د.إ', label: 'UAE Dirham', display: 'د.إ AED' },
  { code: 'CAD', symbol: 'CA$', label: 'Canadian Dollar', display: 'CA$ CAD' },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar', display: 'A$ AUD' },
];

export const DEFAULT_CURRENCY = '₹ INR';

/**
 * Extracts the symbol from a currency string (e.g., '₹ INR' -> '₹', '$ USD' -> '$')
 */
export function getCurrencySymbol(currencyStr?: string): string {
  if (!currencyStr) return '₹';
  const trimmed = currencyStr.trim();
  const match = SUPPORTED_CURRENCIES.find(
    (c) => c.display === trimmed || c.code === trimmed || c.symbol === trimmed
  );
  if (match) return match.symbol;
  // Fallback: take first part before space or the string itself
  const firstPart = trimmed.split(' ')[0];
  return firstPart || '₹';
}

/**
 * Formats a numeric amount with the currency symbol and local number separators.
 */
export function formatMoney(amount: number, currencyStr?: string): string {
  const symbol = getCurrencySymbol(currencyStr);
  const formattedNumber = Math.abs(amount).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
  return `${amount < 0 ? '-' : ''}${symbol}${formattedNumber}`;
}
