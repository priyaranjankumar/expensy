// Shared formatting utilities

/**
 * Format a number as INR currency string.
 * Example: 17729 → "₹17,729"
 */
export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(amount);
};
