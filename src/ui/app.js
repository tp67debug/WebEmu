// src/ui/app.js

let emuWorker = null;

document.addEventListener('DOMContentLoaded', () => {
    const powerButton = document.getElementById('power-on-btn'); // Adjust ID to match your actual HTML button ID
    
    if (powerButton) {
        powerButton.addEventListener('click', startEmulation);
    }
});

async function startEmulation() {
    try {
        terminal.writeln("[Power On] Initializing WebEmu instance...");
        terminal.writeln("> Target Architecture: X86_64");
        terminal.writeln("> Firmware Mode: BIOS");
        terminal.writeln("> Allocated RAM: 128 MB");

        // 1. Fetch ROMs and Media (update paths if your folder structure differs)
        terminal.writeln("> Fetching ROM binaries from /bios/...");
        
        const [biosRes, vgaRes] = await Promise.all([
            fetch('./bios/seabios.bin'),
            fetch('./bios/vgabios.bin')
        ]);

        if (!biosRes.ok || !vgaRes.ok) {
            throw new Error("Failed to fetch BIOS ROM binaries. Check /bios/ folder.");
        }

        const biosBuffer = await biosRes.arrayBuffer();
        const vgaBiosBuffer = await vgaRes.arrayBuffer();

        terminal.writeln(`> Firmware loaded: seabios.bin (${biosBuffer.byteLength} bytes)`);
        terminal.writeln(`> VGA BIOS loaded: vgabios.bin (${vgaBiosBuffer.byteLength} bytes)`);

        // 2. Clean up existing worker if any
        if (emuWorker) {
            emuWorker.terminate();
        }

        // 3. Spawn the Web Worker safely without import.meta errors
        terminal.writeln("> Handing over execution to WebAssembly Core..");
        
        emuWorker = new Worker('./src/worker/emu.worker.js');

        emuWorker.onmessage = function(e) {
            const { type, message, isError } = e.data;
            if (type === 'LOG') {
                if (isError) {
                    terminal.writeln(`[Error] ${message}`);
                } else {
                    terminal.writeln(message);
                }
            }
        };

        emuWorker.onerror = function(err) {
            terminal.writeln(`[Worker Error] ${err.message}`);
            console.error("Worker error:", err);
        };

        // 4. Send boot payload to worker
        emuWorker.postMessage({
            type: 'BOOT',
            bios: biosBuffer,
            vgaBios: vgaBiosBuffer
        }, [biosBuffer, vgaBiosBuffer]);

    } catch (err) {
        terminal.writeln(`[Fatal Error] ${err.message}`);
        console.error(err);
    }
}
