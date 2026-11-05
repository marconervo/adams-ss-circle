# An Adams spectral sequence for the Goodwillie tower of the circle

A browser-based calculator for the mod-p Adams E₂-page of symmetric product
spectra, used to study the Goodwillie approximations of the circle. Choose a
prime and a degree range, compute the chart, and export the results.

The algebra and resolution are computed by the bundled WebAssembly build of
[SpectralSequences/sseq](https://github.com/SpectralSequences/sseq) (`ext-rs`).
The JavaScript in this repository prepares the module, runs the engine, and draws
the chart. Computations run locally in the browser; no calculation server is needed.

## Run locally

Serve the project directory with a static HTTP server. For example, with Python
installed, open a terminal in this directory and run:

```sh
python -m http.server 8000
```

On Windows, use `py` in place of `python` if needed. Then open
[localhost:8000](http://localhost:8000).

Use a current browser with WebAssembly support. Open the page through HTTP rather
than by double-clicking [index.html](./index.html), because the app uses JavaScript
modules and a Web Worker. No build step, npm dependencies, or Rust installation
is needed. To publish the app, serve this directory on a static host such as
GitHub Pages.

## Use the calculator

The page computes the default settings on first load. Change the inputs and click
**Compute E₂** to start another calculation.

| Input | Meaning | Default |
| --- | --- | --- |
| Prime `p` | The prime for mod-p cohomology. | 2 |
| Approximation degree `k` | Selects the Goodwillie stage indexed by pᵏ; `k ≥ 0`. | 1 |
| Max. range `R` | Largest displayed homotopy degree; `R ≥ 1`. | 20 |
| Max. filtration `S` | Largest computed Adams filtration; `S ≥ 0`. | 15 |

The chart displays homotopy degrees 1 through `R` and filtrations 0 through `S`.
Dots represent basis elements of Ext. Colored lines show nonzero entries in
product matrices: `h₀`, `h₁`, and `h₂` at p = 2, or `a₀` and `h₀` at odd primes.
Use the legend checkboxes to show or hide these lines.

The tower at homotopy degree 1 has black dots and lines in the corresponding
product color. For `k > 0`, it is added separately to represent the known ℤ factor,
with p-completion ℤₚ. For `k = 0`, the computed sphere tower already occupies this
column, so no additional tower is drawn.

Each calculation runs in a fresh Web Worker to keep the interface responsive.
**Stop** terminates the worker and discards the incomplete chart. Results are not
saved between page loads. Large ranges or filtrations may require substantial
memory and time; the engine also imposes signed 32-bit degree limits.

### Downloads

- **Download module** exports the module presentation as JSON. It becomes available
  as soon as the presentation has been generated.
- **Download data** exports the settings, module, computed classes, product matrices,
  and separate fundamental-group tower as JSON.
- **Download SVG** exports the chart with the currently selected product lines.

The data and SVG downloads become available when the calculation finishes.
The data export retains the stable coordinates and actual coefficients in the
product matrices, regardless of which lines are visible.

## Mathematical background

Write $\mathbb{Sp}^{m}$ for the mth symmetric product spectrum. The construction
uses the p-local equivalence from [Ner26, Theorem C]:

$$
\Omega P_{p^k}I(S^1)
\simeq \mathbb{Z}\times
\Omega^{\infty+2k}\tau_{>0}\mathbb{Sp}^{p^k}
$$

where $\tau_{>0}$ denotes the connective cover. This relates the Goodwillie
approximation to a stable calculation with symmetric product spectra.

Nakaoka's description [Nak58, §5, Main Theorem] gives

$$
H^*(\mathbb{Sp}^{p^k};\mathbb{F}_p)
\cong \mathcal{A}/(\mathcal{A}\beta+\mathcal{A}_{>k})
$$

where $\mathcal{A}$ is the mod-p Steenrod algebra, $\beta$ is the Bockstein, and
$\mathcal{A}_{>k}$ is the length-filtration left ideal. The quotient has a basis
consisting of the unit and admissible monomials of length at most k that do not
end in the Bockstein.

The engine computes the stable Adams E₂-page

$$
E_2^{s,t}=Ext_{\mathcal{A}}^{s,t}
\bigl(H^*(\mathbb{Sp}^{p^k};\mathbb{F}_p),\mathbb{F}_p\bigr)
$$

The chart uses the horizontal coordinate $q=t-s-2k+1$. For q ≥ 2, this is the
homotopy-degree shift supplied by the equivalence above. The q = 1 tower is
handled separately as described above. The classical mod-p Adams spectral
sequence concerns p-completed homotopy groups.

### Module presentation and bounds

The module has one generator, `x0`, in degree zero. For `k > 0`, the presentation
imposes `Sq1 x0` at p = 2, or `b x0` at odd primes, together with a reduced list
of pure admissible relations of length `k + 1`. Their exponents are powers of 2
starting at 2 for squares, or powers of p starting at 1 for reduced powers.
For `k = 0`, the engine receives the trivial module 𝔽ₚ directly.

Relations are generated through internal degree `T = R + 2k + S`. The resolver
runs through stable stem `R + 2k − 1` and filtration `S`; the extra internal
degree supplies padding for its boundary-kernel computation. Higher-degree
relations are omitted, rather than forcing the module to vanish above the cutoff.

The app no longer supplies an independent module-dimension count. The bundled
engine supports this optional check, but it is inactive for these calculations.
An incomplete relation list will therefore not be caught by that check.

### Scope

The chart shows an E₂-page, not a determination of the homotopy groups.
Differentials, hidden extensions, and final group decompositions are not computed.
The change of horizontal coordinate does not identify the stable Adams filtration
with the unstable Adams filtration of the Goodwillie approximation. The selected
filtration cutoff does not assert vanishing in higher filtrations.

## Read and edit the code

| File | Responsibility |
| --- | --- |
| [module.js](./module.js) | Validate inputs, compute bounds, generate relations, and convert coordinates. |
| [worker.js](./worker.js) | Initialize the WebAssembly engine and pass calculation messages to the page. |
| [app.js](./app.js) | Handle controls, collect results, draw the SVG chart, and create downloads. |
| [index.html](./index.html) | Define the interface, mathematical introduction, and references. |
| [math.js](./math.js) | Render the introduction's LaTeX with locally bundled KaTeX. |
| [style.css](./style.css) | Style the page. |
| [vendor/](./vendor/) | Bundled engine, KaTeX assets, and third-party licenses. |

For the calculation flow, start with [module.js](./module.js), then read
[worker.js](./worker.js) and [app.js](./app.js). Edit explanatory text and formulas
in [index.html](./index.html); edit product colors and chart drawing in
[app.js](./app.js). Save and refresh the local page to preview changes before
committing them.

See [vendor/NOTICE.md](./vendor/NOTICE.md) for the engine source revision,
adapter details, checksums, and dependency credits. This repository contains
the ready-to-run assets; it does not include the original engine build scripts
or an automated test harness.

## References

- **[CCB]** Hood Chatham, Dexter Chua, and Joey Beauvais-Feisthauer.
  *The Spectral Sequences Project*, `ext` / `ext-rs` resolution software.
  [Source repository](https://github.com/SpectralSequences/sseq).
- **[Nak58]** Minoru Nakaoka. *Cohomology mod p of symmetric products of spheres.*
  Journal of the Institute of Polytechnics, Osaka City University, Series A,
  Mathematics **9** (1) (1958), 1–18.
- **[Ner26]** Marco Nervo. *An abelian model for the Goodwillie tower of the circle.*
  Preprint, 2026. arXiv:2609.31269.
