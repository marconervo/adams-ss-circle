// Local KaTeX assets keep the mathematical introduction independent of a CDN.
renderMathInElement(document.querySelector('.notes'), {
  delimiters: [
    { left: '\\[', right: '\\]', display: true },
    { left: '\\(', right: '\\)', display: false }
  ],
  throwOnError: true
});
