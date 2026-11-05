const DECIMAL_PLACES = 6;
const SCALE = 10n ** BigInt(DECIMAL_PLACES);

export function multiplyEth(value: string, quantity: number): string {
  const [whole = '0', fraction = ''] = value.split('.');
  const units =
    BigInt(whole) * SCALE +
    BigInt((fraction + '0'.repeat(DECIMAL_PLACES)).slice(0, DECIMAL_PLACES));
  const result = units * BigInt(quantity);
  const integer = result / SCALE;
  const decimal = (result % SCALE).toString().padStart(DECIMAL_PLACES, '0').replace(/0+$/, '');
  return decimal ? `${integer}.${decimal}` : integer.toString();
}
