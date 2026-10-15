// WebEmu Background Execution Worker
// Handles CPU simulation and memory bus off the main UI thread

let vmState = {
    running: false,
    arch: 'x86',
    ramSizeMB: 64,
    memory: null,
};

self.onmessage = function(e) {
    const { action, payload } = e.data;

    switch (action) {
        case 'INIT_VM':
            initVM(payload);
            break;
        case 'START_VM':
            startVM();
            break;
        case 'STOP_VM':
            stopVM();
            break;
        default:
            postMessage({ type: 'LOG', message: `[Worker] Unknown action: ${action}`, isError: true });
    }
};

function initVM(config) {
    vmState.arch = config.arch;
    vmState.ramSizeMB = parseInt(config.ramSizeMB, 10);

    // Allocate emulated RAM as an ArrayBuffer (SharedArrayBuffer or standard ArrayBuffer)
    const byteLength = vmState.ramSizeMB * 1024 * 1024;
    try {
        vmState.memory = new ArrayBuffer(byteLength);
        postMessage({ 
            type: 'LOG', 
            message: `[Worker] Successfully allocated ${vmState.ramSizeMB} MB of physical memory space.` 
        });
    } catch (err) {
        postMessage({ 
            type: 'LOG', 
            message: `[Worker Error] Failed to allocate memory: ${err.message}`, 
            isError: true 
        });
    }
}

function startVM() {
    if (!vmState.memory) {
        postMessage({ type: 'LOG', message: `[Worker Error] Cannot start VM. Memory not initialized.`, isError: true });
        return;
    }

    vmState.running = true;
    postMessage({ type: 'LOG', message: `[Worker] CPU execution loop started for ${vmState.arch.toUpperCase()}...` });

    // Emulated CPU instruction fetch loop stub
    let cycles = 0;
    const executionInterval = setInterval(() => {
        if (!vmState.running) {
            clearInterval(executionInterval);
            return;
        }
        cycles += 1000;
        // Periodically report status back to the main thread
        if (cycles % 10000 === 0) {
            postMessage({ type: 'STATS', cycles: cycles });
        }
    }, 100);
}

function stopVM() {
    vmState.running = false;
    postMessage({ type: 'LOG', message: `[Worker] VM halted.` });
}
