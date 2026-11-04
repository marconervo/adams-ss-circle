# An Adams SS for the Goodwillie tower of the circle

A small, buildless webpage. Enter a prime `p` (default 2), `k`, `R` and a maximum filtration `S` (default 15) to compute the mod-p stable
Adams E2 page for `Sp^(p^k)`, with the horizontal axis reindexed
to homotopy degree in `S^1_k = P_(p^k) I(S^1)`.

The resolution, Steenrod algebra arithmetic, and products come from
[SpectralSequences/sseq](https://github.com/SpectralSequences/sseq).
A small adapter adds a chosen filtration bound and a module-dimension check;
the algebra and resolution algorithms are unchanged. No Ext solver, Adem
reduction, backend, or framework is implemented here. The browser computes real results.

## Run locally

From the extracted source directory:

```sh
python -m http.server 8000 --directory dist
```

Open http://localhost:8000 in a current browser. On Windows, `py` can replace
`python`. Use HTTP, rather than opening `index.html` directly, because browser
workers and WebAssembly need served files. No Python packages are needed.
The first load includes a roughly 15 MB engine; subsequent loads can use the
browser cache. Once served, computation requires no external service.

For mathematical checks, install a current Node.js release and run:

```sh
npm test
```

There are no npm dependencies and no `npm install` step.

## Read the code in this order

| File | Responsibility |
| --- | --- |
| `dist/module.js` | Validate parameters, translate degree bounds, generate the module presentation. Start here. |
| `dist/worker.js` | Initialize the existing engine and forward its messages. |
| `dist/app.js` | Handle controls, collect Ext classes and product matrices, render SVG, export files. |
| `dist/index.html`, `dist/style.css` | The interface, mathematical introduction, references, and appearance. |
| `dist/math.js` | Render the introduction with locally bundled KaTeX. Edit the LaTeX directly in `index.html`. |
| `tests/math.test.mjs` | Mathematical regression tests using the actual engine. |
| `dist/vendor/` | Upstream engine, licenses and checksums. Do not edit these to learn the app. |
| `engine/adapter.patch` | The small Rust adapter; normal use needs no Rust installation or rebuild. |

A useful first exercise: read `relations(2, 2, 10)` and predict its output before
running it. Next, add a visible count of the relations supplied to the engine.

## Mathematics

The module starts with one generator `x0` in degree zero. At p=2 we impose
`Sq1 x0` and admissible words of length k+1 made of `Sq^(2^j)` with j>=1.
At an odd prime we impose `b x0` and admissible words of length k+1 made of
`P^(p^j)` with j>=0, as in Marco's presentation. Pure admissibility means
`a_i >= p a_(i+1)`. For k=0 we use the trivial module F_p directly.

`relations(p, length, limit)` enumerates exponent tuples. Its limit is an
**exponent sum**: Sq^a has degree a, whereas P^a has degree 2(p-1)a.
`symmetricPowerModule(p, k, degree)` makes this conversion and produces the JSON
accepted by ext-rs. Setting its fourth argument to false includes all integer
exponents in the pure admissible words, for comparison. The odd-prime tests also
construct the full list with interior Bocksteins independently.

Every reduced relation lies in the full length ideal, giving a surjection
onto the intended quotient. Before resolving, the existing adapter checks its
dimension in **every internal degree through the cutoff** against the
admissible basis count. Equality of dimensions certifies the quotient in that
range. A mismatch stops the calculation. We do not infer a general theorem
about the reduced list from checking only a few Ext groups.

`moduleDimensions(p, k, degree)` counts the basis via generating series. At p=2:

    1 + sum_(l=1)^k x^(2(2^l-1)) / product_(j=1)^l (1-x^(2^j-1)).

At odd p:

    1 + sum_(l=1)^k x^(2(p^l-1))
        * product_(j=0)^(l-1) (1+x^(2p^j-1))
        / product_(j=1)^l (1-x^(2(p^j-1))).

For p=2, an admissible word of length l has last exponent at least 2.
Writing r_i=a_i-2a_(i+1) for i<l and r_l=a_l-2 gives the geometric factors.
At odd p the basis words are b^e0 P^a1 b^e1 ... P^al, with a_l>=1 and
`a_i >= p a_(i+1)+e_i`. The leading Bockstein contributes (1+x); each interior
Bockstein contributes (1+x^(2p^i-1)), including its effect on admissibility.
Nonnegative excesses give the denominator. The code expands these factors
using short loops; it does not implement Steenrod arithmetic.

The JSON field `expected_dimensions` carries the count. Upstream versions
without our adapter ignore it but can still read the module relations.

These are relations in the full Steenrod algebra, not a smaller A(n).
The infinite module is represented by a finite presentation that agrees with
it through the required internal degree; we do not force all higher cells to zero.

See M. J. Hopkins, [Symmetric powers of the sphere](https://people.math.harvard.edu/~lurie/ThursdayFall2017/Lecture13-Symmetric-power.pdf),
§1.2.1, especially the description of F_n^Z on page 5.

### Bounds and the shift

The engine computes `Ext_A^(s,t)(H*(Sp^(p^k)), F_p)`. Write `n = t-s`.
From Marco Nervo's equivalence

    Omega S^1_k ≃ Z × Omega^(infinity+2k) tau_(>0) Sp^(p^k),

the positive-degree homotopy groups are related by

    pi_q(S^1_k) ≅ pi_(q+2k-1)(Sp^(p^k)),   q >= 2,

in the theorem's local setting. The classical Adams spectral sequence here
has the p-completed abutment. Accordingly the displayed homotopy coordinate is
`q = n-2k+1`. The chart includes `1 <= q <= R`, omitting degree zero.
At q=1 we include the tower representing pi_1 = Z, completed to Z_p.
For k>0 this is the explicit Z factor, shown in black and recorded separately
in the export's `fundamentalGroup` field. It is not claimed to be a shifted
Ext class of Sp^(p^k). For k=0 the computed sphere tower already sits at q=1
and is shown only once, also in black, with its computed products. The data export
retains the original Sp^(p^k) computation and its stable-stem coordinates.

For input `R` we resolve through stable stem `D = R+2k-1` and the chosen
filtration `S`. Our adapter passes S directly to the existing resolver;
the height setting really limits computation. Our relation cutoff is
`T = D+S+1`. This includes the entire requested internal-degree window plus
one degree of padding for the engine's boundary-kernel computation.
Agreement of nonnegative graded modules through internal degree T suffices
for their Ext in this window: the normalized bar calculation in internal
degree t only uses module degrees at most t. Higher-degree omitted relations
cannot change these results. Increasing the cutoff and range is also tested.

The chart shows rows 0 through S, including empty rows. It does not assert
vanishing above that bound.

This is the stable ASS of Sp^(p^k), transported at the level of the abutment.
We do not assert an identification with the unstable Adams filtration on S^1_k,
or with the E2 page of its connective-cover model.

Reference: [An abelian model for the Goodwillie tower of the circle](https://arxiv.org/abs/2609.31269).

### Products and limitations

- The prime p is typed freely and checked for primality; it is not a fixed list.
  The stage k is a nonnegative integer and R is a positive integer.
- Maximum filtration S is a nonnegative integer, default 15. S=0 is allowed.
- There is no fixed upper range or stage cap. Available memory and computing
  time determine practical limits; input degrees must fit the upstream engine's
  signed 32-bit format, including the degree 2(p-1) of P^1.
  Module generation runs in the worker too, so Stop remains usable.
- Dark dots are basis elements of Ext, not certified homotopy classes.
  The black q=1 tower separately represents the known Z factor (at every prime).
- Lines display h0, h1, h2 at p=2, and a0, h0 at odd primes, following the
  upstream Adem engine's available products. At odd primes a0 is dual to b
  and h0 to P^1. No higher products are inferred. A line marks a nonzero matrix
  entry; the JSON export retains its actual F_p coefficient (not just 0 or 1)
  and all computed product matrices. The known Z tower uses h0 or a0 accordingly.
- Differentials, E_infinity, extensions and actual group decompositions are not computed.
- Stop terminates the worker (including module generation) and discards the incomplete calculation.
- Every new calculation starts a fresh worker; there is no result database or application cache.

## Verification

`npm test` checks:

1. Parameter validation and the homotopy-degree shift.
2. Relation enumeration against independent brute force.
3. Known sphere Ext classes, the h0 tower and h1 squared.
4. The k=1 computation against an independently constructed finite-dimensional
   module: Sq^a Sq^b reduces in the length-one quotient to
   binomial(b-1,a) Sq^(a+b), with the binomial taken mod 2.
5. Agreement in overlapping ranges when relation cutoffs and resolution ranges increase.
6. Agreement with Ext for HZ before a length relation can occur.
7. The pi_1 tower's provenance and absence of duplication at k=0.
8. A real k=1, R=50, S=15 computation, checking its common region.
9. The generating-series dimension count against direct enumeration.
10. Equality of full and reduced presentations, including all computed product matrices, for k=1,2,3.
11. Rejection of a deliberately incorrect presentation with an essential relation removed.
12. Actual resolution bounds at S=0 and S=4.
13. Prime validation, including primes outside a small preset list.
14. Odd-prime dimension counts against direct enumeration with Bocksteins.
15. Correct degree cutoffs for reduced-power relations.
16. Known sphere a0 towers and first h0 classes at p=3,5,7,11.
17. Reduced versus full presentations at p=3,5,7, including k=2 at p=3.
18. Rejection of a missing essential odd-prime relation.
19. Independent k=1 finite-dimensional action tables at p=3,5, including products.

The test harness runs the exact shipped WASM in Node. Browser
checks cover the prime selector, changing primes, validation, and black towers.
Earlier p=2 checks also included k=1 at R=80 and k=2 at R=50,
both with S=15 and degreewise certification enabled.
These checks are regression evidence, not a complete verification of the upstream engine.

At p=2, the redundant presentation was a substantial bottleneck: at the old R=50
cutoff (internal degree 82), it supplied 1,028 relations; the reduced list has
15. In a local comparison, the old version did not finish within a 25-second
timeout, while the reduced presentation finished in about one second using
the original automatic filtration bound. With the new S=15 bound and the
dimension check, the updated engine completed this case in about 0.4 seconds.
Timings depend on browser and hardware; larger computations still take time.

## Rebuilding the engine (optional)

The ready-to-run WASM is included. Learning or editing the JavaScript does not
require Rust. If you change the adapter, run `sh scripts/rebuild-engine.sh /absolute/path/to/new-checkout`
from a shell with Git and rustup installed. The script uses the pinned upstream
commit, Rust version and Cargo.lock, applies the adapter, and regenerates the
two vendored engine files. Run `npm test`, update the checksums in
`dist/vendor/NOTICE.md`, and check the browser before distributing the new build.

## Export and distribution

The page exports its chart as SVG, its computation as JSON, and the exact module
input as JSON compatible with the upstream resolver's Adem mode. Data contains
the bounds, module, basis dimensions and product matrices, making the computation
reproducible with the vendored engine. Engine URLs and SHA-256 checksums are in
`dist/vendor/NOTICE.md`.

`python scripts/package-source.py` refreshes the downloadable `dist/source.zip`
and the served README. It is only needed after editing source you want to distribute.
The zip excludes deployment identity and Git metadata. Hosting is ordinary static
hosting of `dist/`; no build step is needed.
