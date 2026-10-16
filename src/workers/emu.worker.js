// src/worker/emu.worker.js

self.onmessage = async function(e) {
    const { type, bios, vgaBios } = e.data;

    if (type === 'BOOT') {
        postMessage({ type: 'LOG', message: '[Worker] Boot payload received successfully.' });
        postMessage({ type: 'LOG', message: `[Worker] BIOS buffer size: ${bios.byteLength} bytes` });
        postMessage({ type: 'LOG', message: `[Worker] VGA BIOS buffer size: ${vgaBios.byteLength} bytes` });

        try {
            postMessage({ type: 'LOG', message: '[Worker] Loading WebAssembly core...' });

            // Example: If your WASM binary is loaded via fetch inside the worker:
            // const wasmRes = await fetch('../wasm/emu_core.wasm');
            // const wasmBuffer = await wasmRes.arrayBuffer();
            // 
            // const imports = { /* your WASM imports / memory setup */ };
            // const { instance } = await WebAssembly.instantiate(wasmBuffer, imports);
            // 
            // // Pass buffers into WASM memory and start execution
            // instance.exports.start_emulation();

            postMessage({ type: 'LOG', message: '[Worker] WASM core execution started.' });

        } catch (err) {
            postMessage({ 
                type: 'LOG', 
                message: `[Worker Fatal Error] ${err.message}`, 
                isError: true 
            });
        }
    }
};
