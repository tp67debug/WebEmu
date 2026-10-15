/**
 * WebEmu Frontend Application Controller
 * Coordinates UI inputs, Web Worker execution, terminal logging, and ROM loading.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize UI wrappers
    const terminal = new EmulatorTerminal('terminal');
    const storage = new EmulatorStorage();
    let emuWorker = null;

    terminal.writeln("WebEmu system initialized.");
    terminal.writeln("Ready to load BIOS, memory tables, and device bus.");

    // Expose boot function globally so index.html button can trigger it
    window.bootWebEmu = async function() {
        const arch = document.getElementById("arch-select").value;
        const firmware = document.getElementById("firmware-mode").value;
        const ram = document.getElementById("ram-size").value;
        const fileInput = document.getElementById("disk-file").files[0];

        terminal.clear();
        terminal.writeln(`[Power On] Initializing WebEmu instance...`);
        terminal.writeln(`> Target Architecture: ${arch.toUpperCase()}`);
        terminal.writeln(`> Firmware Mode: ${firmware.toUpperCase()}`);
        terminal.writeln(`> Allocated RAM: ${ram} MB`);

        if (fileInput) {
            terminal.writeln(`> Attached Media: ${fileInput.name} (${(fileInput.size / 1024 / 1024).toFixed(2)} MB)`);
        } else {
            terminal.writeln(`> Warning: No boot disk or kernel image attached.`);
        }

        try {
            terminal.writeln(`> Fetching ROM binaries from /bios/...`);
            
            // Select appropriate ROM files based on firmware choice
            const biosFilename = firmware === 'uefi' ? 'bochs-bios.bin' : 'seabios.bin';
            const vgaFilename = firmware === 'uefi' ? 'bochs-vgabios.bin' : 'vgabios.bin';

            const [biosData, vgaData] = await Promise.all([
                fetch(`./bios/${biosFilename}`).then(res => {
                    if (!res.ok) throw new Error(`${biosFilename} missing from /bios/ directory`);
                    return res.arrayBuffer();
                }),
                fetch(`./bios/${vgaFilename}`).then(res => {
                    if (!res.ok) throw new Error(`${vgaFilename} missing from /bios/ directory`);
                    return res.arrayBuffer();
                })
            ]);

            terminal.writeln(`> Firmware loaded: ${biosFilename} (${biosData.byteLength} bytes)`);
            terminal.writeln(`> VGA BIOS loaded: ${vgaFilename} (${vgaData.byteLength} bytes)`);

            // Terminate existing worker if running
            if (emuWorker) {
                emuWorker.terminate();
            }

            // Spawn background execution worker
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

            // Initialize and start VM inside the worker thread
            emuWorker.postMessage({
                action: 'INIT_VM',
                payload: { arch, ramSizeMB: ram }
            });

            // Send fetched BIOS and VGA binaries to the worker (with zero-copy transfer)
            emuWorker.postMessage({
                action: 'LOAD_ROM',
                payload: {
                    bios: biosData,
                    vga: vgaData
                },
                transfer: [biosData, vgaData]
            });

            emuWorker.postMessage({
                action: 'START_VM'
            });

        } catch (err) {
            terminal.writeln(`[Error] ${err.message}`);
            terminal.writeln(`[Hint] Ensure your ROM binaries are placed inside the /bios/ folder.`);
        }
    };
});
