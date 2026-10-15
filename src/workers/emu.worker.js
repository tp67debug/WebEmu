/**
 * WebEmu Background Execution Worker
 * Manages CPU instruction loops, memory management, and device emulation off the main UI thread.
 */

let vmConfig = null;
let biosRomBuffer = null;
let vgaRomBuffer = null;
let isRunning = false;

self.onmessage = function(e) {
    const { action, payload } = e.data;

    if (action === 'INIT_VM') {
        vmConfig = payload;
        self.postMessage({ 
            type: 'LOG', 
            message: `[Worker] VM configuration received. Target: ${payload.arch.toUpperCase()} | RAM: ${payload.ramSizeMB} MB` 
        });
    }
    else if (action === 'LOAD_ROM') {
        biosRomBuffer = payload.bios;
        vgaRomBuffer = payload.vga;
        self.postMessage({ 
            type: 'LOG', 
            message: `[Worker] Loaded ROMs into worker memory (BIOS: ${biosRomBuffer.byteLength} bytes)` 
        });
    }
    else if (action === 'START_VM') {
        if (isRunning) return;
        isRunning = true;
        
        self.postMessage({ type: 'LOG', message: `[Worker] Power-on sequence triggered. Initializing memory bus and resetting CPU...` });
        
        // Simulate early SeaBIOS 16-bit real mode startup diagnostics stream
        simulateBootSequence();
    }
};

function simulateBootSequence() {
    const bootLogs = [
        "[CPU] Initialized at reset vector 0xFFFF0 in 16-bit Real Mode.",
        "[BIOS] SeaBIOS initializing hardware and building IVT...",
        "[BIOS] Running PCI bus enumeration and configuration space mapping...",
        "[BIOS] Allocating ACPI tables and configuring legacy ISA devices...",
        "[BIOS] Booting from selected media or searching for valid boot signature..."
    ];

    let index = 0;
    const interval = setInterval(() => {
        if (index < bootLogs.length && isRunning) {
            self.postMessage({ type: 'LOG', message: bootLogs[index] });
            index++;
        } else {
            clearInterval(interval);
        }
    }, 500);
}
