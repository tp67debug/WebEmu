// WebEmu WebSocket Network Bridge (NE2000 Packet Relay)

class EmulatorNetwork {
    constructor(relayUrl = 'wss://relay.widgetry.org') {
        this.relayUrl = relayUrl;
        this.socket = null;
        this.connected = false;
    }

    connect() {
        try {
            this.socket = new WebSocket(this.relayUrl);
            this.socket.binaryType = 'arraybuffer';

            this.socket.onopen = () => {
                this.connected = true;
                console.log("[Network] Connected to remote packet relay server.");
            };

            this.socket.onmessage = (event) => {
                // Route incoming ethernet frame bytes to the virtual machine bus
                this.handleIncomingPacket(event.data);
            };

            this.socket.onclose = () => {
                this.connected = false;
                console.log("[Network] Disconnected from packet relay server.");
            };
        } catch (err) {
            console.error("[Network Error] Failed to open WebSocket tunnel:", err);
        }
    }

    sendPacket(arrayBuffer) {
        if (this.connected && this.socket) {
            this.socket.send(arrayBuffer);
        }
    }

    handleIncomingPacket(data) {
        // Reserved for routing frames back into the emulated NIC controller
    }
}

window.EmulatorNetwork = EmulatorNetwork;
