// src/worker/emu.worker.js

self.onmessage = async function(e) {
    const { type, bios, vgaBios, diskImage } = e.data;

    if (type === 'BOOT') {
        try {
            postMessage({ type: 'LOG', message: '[Worker] BOOT payload received.' });
            postMessage({ type: 'LOG', message: `[Worker] BIOS: ${bios ? bios.byteLength : 0} bytes` });
            postMessage({ type: 'LOG', message: `[Worker] VGA BIOS: ${vgaBios ? vgaBios.byteLength : 0} bytes` });

            postMessage({ type: 'LOG', message: '[Worker] Fetching compiled WASM core binary...' });
            
            // Adjust path to your compiled .wasm file if needed
            const wasmRes = await fetch('../core/wasm/emulator.wasm').catch(() => fetch('./core/wasm/emulator.wasm'));
            if (!wasmRes.ok) {
                throw new Error(`Failed to fetch WASM binary (HTTP ${wasmRes.status})`);
            }
            
            const wasmBuffer = await wasmRes.arrayBuffer();
            postMessage({ type: 'LOG', message: `[Worker] WASM binary loaded (${wasmBuffer.byteLength} bytes). Instantiating...` });

            // Setup imports expected by your C++ core
            const importObject = {
                env: {
                    memory: new WebAssembly.Memory({ initial: 2048 }), // 128MB+ allocation
                    emscripten_notify_memory_growth: function() {}
                },
                wasi_snapshot_preview1: {
                    proc_exit: (code) => { console.log("Process exit:", code); },
                    fd_write: () => 0,
                    fd_close: () => 0,
                    fd_seek: () => 0
                }
            };

            const { instance } = await WebAssembly.instantiate(wasmBuffer, importObject);
            postMessage({ type: 'LOG', message: '[Worker] WASM instantiated successfully!' });

            // If your C++ core has an initialization export (e.g., init_emulator or main)
            if (instance.exports.init_emulator) {
                instance.exports.init_emulator();
                postMessage({ type: 'LOG', message: '[Worker] C++ core initialized.' });
            }

        } catch (err) {
            postMessage({ 
                type: 'LOG', 
                message: `[Worker Error] ${err.message}`, 
                isError: true 
            });
            console.error(err);
        }
    }
};
