/**
 * WebEmu - Physical Memory Bus & MMIO Controller
 * Manages physical address translation, RAM/ROM banking, and I/O port routing.
 */

#include <vector>
#include <cstdint>
#include <stdexcept>
#include <iostream>
#include <functional>

class MemoryBus {
private:
    std::vector<uint8_t> ram;
    std::vector<uint8_t> bios_rom;
    size_t ram_size_mb;

    // I/O Port dispatch maps
    std::function<uint8_t(uint16_t)> io_read_handlers[65536];
    std::function<void(uint16_t, uint8_t)> io_write_handlers[65536];

public:
    MemoryBus(size_t ramMB = 64) : ram_size_mb(ramMB) {
        // Allocate physical RAM
        ram.resize(ram_size_mb * 1024 * 1024, 0);
        
        // Allocate 128KB standard legacy BIOS ROM window
        bios_rom.resize(128 * 1024, 0xFF); 

        // Initialize default empty I/O handlers
        for (int i = 0; i < 65536; i++) {
            io_read_handlers[i] = [](uint16_t) { return 0xFF; };
            io_write_handlers[i] = [](uint16_t, uint8_t) {};
        }
    }

    void loadBios(const uint8_t* data, size_t size) {
        if (size > bios_rom.size()) {
            throw std::runtime_error("[MemoryBus Error] BIOS ROM image exceeds allocated window size.");
        }
        // Copy BIOS to the top of the ROM window (mapped at 0xFFFF0 reset vector area)
        std::copy(data, data + size, bios_rom.end() - size);
        std::cout << "[MemoryBus] Successfully mapped " << size << " bytes of ROM into memory space." << std::endl;
    }

    // 8-bit Physical Read
    uint8_t read8(uint32_t address) {
        // 1MB BIOS Shadow / Reset Vector region (e.g., 0xF0000 - 0xFFFFF mapped to physical top)
        if (address >= 0x000F0000 && address <= 0x000FFFFF) {
            uint32_t offset = address - 0x000F0000;
            return bios_rom[offset + (bios_rom.size() - 65536)];
        }
        // 4GB Top Reset Vector mapping (0xFFFFFFF0)
        if (address >= 0xFFF00000) {
            uint32_t offset = address & (bios_rom.size() - 1);
            return bios_rom[offset];
        }
        // Standard RAM read
        if (address < ram.size()) {
            return ram[address];
        }
        return 0xFF; // Open bus
    }

    // 16-bit Physical Read
    uint16_t read16(uint32_t address) {
        uint16_t low = read8(address);
        uint16_t high = read8(address + 1);
        return low | (high << 8);
    }

    // 32-bit Physical Read
    uint32_t read32(uint32_t address) {
        uint32_t low = read16(address);
        uint32_t high = read16(address + 2);
        return low | (high << 16);
    }

    // 8-bit Physical Write
    void write8(uint32_t address, uint8_t value) {
        if (address < ram.size()) {
            ram[address] = value;
        }
        // Writes to ROM regions are generally ignored or handled by flash controllers
    }

    void write16(uint32_t address, uint16_t value) {
        write8(address, static_cast<uint8_t>(value & 0xFF));
        write8(address + 1, static_cast<uint8_t>((value >> 8) & 0xFF));
    }

    void write32(uint32_t address, uint32_t value) {
        write16(address, static_cast<uint16_t>(value & 0xFFFF));
        write16(address + 2, static_cast<uint16_t>((value >> 16) & 0xFFFF));
    }

    // I/O Port Bus Methods (for hardware devices like PIT, Serial, VGA)
    void registerIOPort(uint16_t port, std::function<uint8_t(uint16_t)> reader, std::function<void(uint16_t, uint8_t)> writer) {
        if (reader) io_read_handlers[port] = reader;
        if (writer) io_write_handlers[port] = writer;
    }

    uint8_t in8(uint16_t port) {
        return io_read_handlers[port](port);
    }

    void out8(uint16_t port, uint8_t value) {
        io_write_handlers[port](port, value);
    }
};
