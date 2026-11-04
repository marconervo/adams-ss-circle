// The arithmetic and resolution are supplied by ext-rs. This file only
// validates inputs and enumerates relations.
export function validatePrime(p) {
  if (!Number.isSafeInteger(p) || p < 2)
    throw new Error('p must be a prime number (2, 3, 5, 7, …).');
  if (p > 1073741823)
    throw new Error("Prime is too large for the resolver's signed 32-bit operation degrees.");
  for (let d = 2; d * d <= p; d++)
    if (p % d === 0) throw new Error(`${p} is not prime.`);
  return p;
}

export function bounds(k, range, filtration = 15) {
  if (!Number.isSafeInteger(k) || k < 0)
    throw new Error('k must be a nonnegative integer.');
  if (!Number.isSafeInteger(range) || range < 1)
    throw new Error('R must be a positive integer.');
  if (!Number.isSafeInteger(filtration) || filtration < 0)
    throw new Error('The maximum filtration must be a nonnegative integer.');
  const stem = range + 2 * k - 1;
  const degree = stem + filtration + 1;
  if (!Number.isSafeInteger(degree) || degree > 2147483647)
    throw new Error("Requested degrees exceed the resolver's 32-bit integer format.");
  return { stem, filtration, degree };
}

// Enumerate pure admissible words by exponent sum, not topological degree.
// At p=2 the final Sq exponent starts at 2; at odd p the final P starts at 1.
// Use powers of p by default; all integer exponents are available for tests.
export function* relations(p, length, limit, powersOnly = true, suffix = []) {
  if (length === 0) { yield suffix; return; }
  const min = suffix.length ? p * suffix[0] : (p === 2 ? 2 : 1);
  // Prepending the remaining entries costs at least 1+p+...+p^{length-1}.
  const max = Math.floor(limit / ((p ** length - 1) / (p - 1)));
  for (let a = min; a <= max; a = powersOnly ? p * a : a + 1)
    yield* relations(p, length - 1, limit - a, powersOnly, [a, ...suffix]);
}

export function symmetricPowerModule(p, k, degree, powersOnly = true) {
  validatePrime(p);
  if (!Number.isInteger(k) || k < 0 || !Number.isInteger(degree) || degree < 1)
    throw new Error('Expected nonnegative k and positive degree.');
  if (k === 0) return { p, type: 'finite dimensional module', gens: { x0: 0 }, actions: [] };
  const operation = p === 2 ? 'Sq' : 'P';
  const unitDegree = p === 2 ? 1 : 2 * (p - 1);
  return {
    p, type: 'finitely presented module', gens: { x0: 0 },
    adem_relations: [p === 2 ? 'Sq1 x0' : 'b x0',
      ...Array.from(relations(p, k + 1, Math.floor(degree / unitDegree), powersOnly),
        word => word.map(a => `${operation}${a}`).join(' ') + ' x0')]
  };
}

export const homotopyDegree = (stem, k) => stem - 2 * k + 1;

// The separate Z factor gives pi_1, displayed with its p-adic tower.
// For k=0 the computed sphere tower already lies at q=1; never duplicate it.
export const fundamentalTower = (k, filtration) => k === 0 ? [] :
  Array.from({ length: filtration + 1 }, (_, s) =>
    ({ q: 1, s, dimension: 1, source: 'pi1-Z-factor' }));
