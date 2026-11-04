// A fresh worker gives each calculation its own WASM memory and makes Stop immediate.
importScripts('./vendor/sseq_gui_wasm.js');
self.onmessage = async ({ data: { prime, k, range, filtration } }) => {
  try {
    const { bounds, symmetricPowerModule } = await import('./module.js');
    const { stem, degree } = bounds(k, range, filtration);
    const module = symmetricPowerModule(prime, k, degree);
    self.postMessage({ module });
    await wasm_bindgen({ module_or_path: './vendor/sseq_gui_wasm_bg.wasm' });
    let failed = false;
    const resolution = wasm_bindgen.Resolution.new(raw => {
      const message = JSON.parse(raw);
      if (message.action.Error) {
        failed = true;
        self.postMessage({ error: message.action.Error.message });
      } else if (message.sseq === 'Main') {
        self.postMessage(message.action);
      }
    });
    const run = action => resolution.run(JSON.stringify({
      recipients: ['Resolver'], sseq: 'Main', action
    }));
    run({ ConstructJson: { algebra_name: 'adem', data: JSON.stringify(module) } });
    if (!failed) run({ Resolve: { max_degree: stem, max_filtration: filtration } });
    if (!failed) self.postMessage({ done: true });
  } catch (error) {
    self.postMessage({ error: error.message || String(error) });
  }
};
