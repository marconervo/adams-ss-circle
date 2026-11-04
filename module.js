// Prepare the module presentation and chart coordinates.
// ext-rs supplies the Steenrod algebra arithmetic and resolution.
const MAX_OPERATION_DEGREE = 2_147_483_647;
// At odd primes, P^1 has degree 2(p - 1). Keep it within the engine's limit.
const MAX_PRIME = 1_073_741_823;

export function validatePrime(prime) {
  if (!Number.isSafeInteger(prime) || prime < 2) {
    throw new Error('p must be a prime number (2, 3, 5, 7, …).');
  }
  if (prime > MAX_PRIME) {
    throw new Error("Prime is too large for the resolver's signed 32-bit operation degrees.");
  }

  for (let divisor = 2; divisor * divisor <= prime; divisor++) {
    if (prime % divisor === 0) {
      throw new Error(`${prime} is not prime.`);
    }
  }

  return prime;
}

// k is the approximation degree; range is the largest displayed homotopy degree.
export function bounds(k, range, filtration = 15) {
  if (!Number.isSafeInteger(k) || k < 0) {
    throw new Error('k must be a nonnegative integer.');
  }
  if (!Number.isSafeInteger(range) || range < 1) {
    throw new Error('R must be a positive integer.');
  }
  if (!Number.isSafeInteger(filtration) || filtration < 0) {
    throw new Error('The maximum filtration must be a nonnegative integer.');
  }

  // q = (t - s) - 2k + 1, so the largest stable stem t - s is range + 2k - 1.
  const stem = range + 2 * k - 1;
  // t = stem + s; add one degree for the engine's boundary-kernel computation.
  const degree = stem + filtration + 1;
  if (!Number.isSafeInteger(degree) || degree > MAX_OPERATION_DEGREE) {
    throw new Error("Requested degrees exceed the resolver's 32-bit integer format.");
  }

  return { stem, filtration, degree };
}

// Yield exponent arrays for pure admissible words, built from right to left.
// The budget is an exponent sum, not a topological degree.
// powersOnly selects the reduced presentation; false includes all exponents.
// suffix holds the already chosen right-hand part during recursion.
export function* relations(prime, length, maxExponentSum, powersOnly = true, suffix = []) {
  if (length === 0) {
    yield suffix;
    return;
  }

  // Admissibility requires a_i >= prime * a_(i+1).
  // The last exponent is at least 2 for Sq, or 1 for P.
  const minExponent = suffix.length ? prime * suffix[0] : (prime === 2 ? 2 : 1);

  // Choosing a here needs at least a * (1 + prime + ... + prime^(length - 1))
  // in total once the remaining exponents have been prepended.
  const minimumSumFactor = (prime ** length - 1) / (prime - 1);
  const maxExponent = Math.floor(maxExponentSum / minimumSumFactor);

  for (
    let exponent = minExponent;
    exponent <= maxExponent;
    exponent = powersOnly ? prime * exponent : exponent + 1
  ) {
    yield* relations(
      prime,
      length - 1,
      maxExponentSum - exponent,
      powersOnly,
      [exponent, ...suffix]
    );
  }
}

// Build the JSON expected by ext-rs, with one generator x0 in degree zero.
// Include relations only through the requested internal degree.
export function symmetricPowerModule(prime, k, degree, powersOnly = true) {
  validatePrime(prime);
  if (!Number.isInteger(k) || k < 0 || !Number.isInteger(degree) || degree < 1) {
    throw new Error('Expected nonnegative k and positive degree.');
  }

  // Sp^1 is the sphere spectrum, whose cohomology is the trivial module F_p.
  if (k === 0) {
    return {
      p: prime,
      type: 'finite dimensional module',
      gens: { x0: 0 },
      actions: []
    };
  }

  const isPrimeTwo = prime === 2;
  const operation = isPrimeTwo ? 'Sq' : 'P';
  // Sq^a has degree a; P^a has degree 2(prime - 1)a.
  const degreePerExponent = isPrimeTwo ? 1 : 2 * (prime - 1);
  const maxExponentSum = Math.floor(degree / degreePerExponent);
  const lengthRelations = Array.from(
    relations(prime, k + 1, maxExponentSum, powersOnly),
    word => word.map(exponent => `${operation}${exponent}`).join(' ') + ' x0'
  );

  return {
    p: prime,
    type: 'finitely presented module',
    gens: { x0: 0 },
    adem_relations: [
      isPrimeTwo ? 'Sq1 x0' : 'b x0',
      ...lengthRelations
    ]
  };
}

// Convert the stable stem t - s to the chart's homotopy coordinate q.
export function homotopyDegree(stem, k) {
  return stem - 2 * k + 1;
}

// The separate Z factor gives pi_1, displayed with its p-adic tower.
// For k=0 the computed sphere tower already lies at q=1; never duplicate it.
export function fundamentalTower(k, filtration) {
  if (k === 0) {
    return [];
  }

  return Array.from({ length: filtration + 1 }, (_, s) => ({
    q: 1,
    s,
    dimension: 1,
    source: 'pi1-Z-factor'
  }));
}
