/**
 * WebEmu - x86/x86_64 CPU Core Emulator
 * Manages registers, execution modes, memory bus binding, and instruction execution.
 */

#include <cstdint>
#include <cstring>
#include <iostream>

enum CPUMode {
    MODE_REAL_16 = 0,
    MODE_PROTECTED_32 = 1,
    MODE_LONG_64 = 2
};

struct X86Registers {
    // General Purpose Registers
    uint64_t rax, rcx, rdx, rbx, rsp, rbp, rsi, rdi;
    #ifdef ARCH_X64
    uint64_t r8, r9, r10, r11, r12, r13, r14, r15;
    #endif

    // Instruction Pointer & Flags
    uint64_t rip;
    uint32_t rflags;

    // Segment Registers
    uint16_t cs, ds, es, fs, gs, ss;

    // Control Registers
    uint64_t cr0, cr3, cr4;
};

class X86CPU {
private:
    MemoryBus& memory_bus; // Reference to the physical memory bus

    uint32_t getPhysicalAddress(uint16_t segment, uint16_t offset) {
        if (mode == MODE_REAL_16) {
            // Real mode calculation: (Segment << 4) + Offset
            return (static_cast<uint32_t>(segment) << 4) + offset;
        }
        // Protected / Long mode stub (flat addressing or paging handled later)
        return offset;
    }

public:
    X86Registers regs;
    CPUMode mode;
    bool halted;

    X86CPU(MemoryBus& bus) : memory_bus(bus) {
        reset();
    }

    void reset() {
        std::memset(&regs, 0, sizeof(X86Registers));
        
        mode = MODE_REAL_16;
        halted = false;

        // Reset Vector: CS = 0xF000, IP = 0xFFF0 -> Physical Address 0xFFFF0
        regs.cs = 0xF000;
        regs.rip = 0xFFF0;
        regs.rflags = 0x00000002; // Reserved bit 1 is always set in rflags
        
        // CR0 initialized with PE=0 (Protected Mode disabled)
        regs.cr0 = 0x60000010; 

        std::cout << "[CPU] Reset vector initialized. Mode: 16-bit Real, CS:IP = 0x" 
                  << std::hex << regs.cs << ":0x" << regs.rip << std::dec << std::endl;
    }

    void step() {
        if (halted) return;

        // Calculate physical address from CS:IP
        uint32_t paddr = getPhysicalAddress(regs.cs, static_cast<uint16_t>(regs.rip));
        
        // Fetch opcode byte from memory bus
        uint8_t opcode = memory_bus.read8(paddr);

        // Basic execution pipeline switch for common startup instructions
        switch (opcode) {
            case 0x90: // NOP
                regs.rip++;
                break;
            case 0xF4: // HLT
                halted = true;
                std::cout << "[CPU] HLT instruction executed at 0x" << std::hex << paddr << std::dec << std::endl;
                break;
            case 0xFA: // CLI (Clear Interrupt Flag)
                regs.rflags &= ~(1 << 9);
                regs.rip++;
                break;
            case 0xFB: // STI (Set Interrupt Flag)
                regs.rflags |= (1 << 9);
                regs.rip++;
                break;
            default:
                // Unhandled instruction stub: advance IP safely to keep boot sequence moving
                regs.rip++;
                break;
        }
    }
};
