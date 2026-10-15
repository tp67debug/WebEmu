/**
 * WebEmu VGA Canvas Viewport Renderer
 * Blits raw pixel framebuffers from the VM into the HTML5 canvas element.
 */

class EmulatorCanvas {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error(`[Canvas] Canvas element #${canvasId} not found.`);
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        this.imageData = this.ctx.createImageData(this.canvas.width, this.canvas.height);
    }

    renderFrame(buffer32, width, height) {
        if (!this.canvas || !this.ctx) return;

        // Resize canvas backing store if resolution changes
        if (this.canvas.width !== width || this.canvas.height !== height) {
            this.canvas.width = width;
            this.canvas.height = height;
            this.imageData = this.ctx.createImageData(width, height);
        }

        // Copy 32-bit RGBA buffer data into ImageData view
        const dataU8 = new Uint8ClampedArray(buffer32.buffer, buffer32.byteOffset, buffer32.byteLength);
        this.imageData.data.set(dataU8);
        this.ctx.putImageData(this.imageData, 0, 0);
    }

    clear() {
        if (this.ctx && this.canvas) {
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
}

window.EmulatorCanvas = EmulatorCanvas;
