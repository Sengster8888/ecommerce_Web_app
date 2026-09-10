export function parsePrice(price: any): number {
  if (price === null || price === undefined) return 0;
  if (typeof price === 'number') return isNaN(price) ? 0 : price;

  if (typeof price === 'string') {
    const cleaned = price.replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }

  if (typeof price === 'object') {
    // Prisma Decimal instance with toNumber method
    if (typeof price.toNumber === 'function') {
      return price.toNumber();
    }
    // Prisma Decimal serialized as { s: 1, e: 2, d: [ 299 ] }
    if (Array.isArray(price.d) && typeof price.e === 'number') {
      const digits = price.d.join('');
      const val = parseFloat(digits) * Math.pow(10, price.e - (digits.length - 1));
      if (!isNaN(val)) return price.s < 0 ? -val : val;
    }
    if (price.value !== undefined) {
      return parsePrice(price.value);
    }
    const str = String(price);
    if (str !== '[object Object]') {
      const parsed = parseFloat(str);
      if (!isNaN(parsed)) return parsed;
    }
  }

  const num = Number(price);
  return isNaN(num) ? 0 : num;
}

export function formatKHR(usdAmount: number, exchangeRate: number = 4100): string {
  const khr = Math.round(usdAmount * exchangeRate);
  return khr.toLocaleString();
}
