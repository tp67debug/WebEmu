/**
 * WebEmu Terminal Wrapper
 * Handles text output, line buffering, and autoscrolling for serial logs.
 */

class EmulatorTerminal {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`[Terminal] Container element #${containerId} not found.`);
        }
    }

    writeln(text) {
        if (!this.container) return;
        const line = document.createElement('div');
        line.textContent = text;
        this.container.appendChild(line);
        this.container.scrollTop = this.container.scrollHeight;
    }

    write(text) {
        if (!this.container) return;
        let lastLine = this.container.lastElementChild;
        if (!lastLine) {
            this.writeln(text);
        } else {
            lastLine.textContent += text;
        }
    }

    clear() {
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

window.EmulatorTerminal = EmulatorTerminal;
