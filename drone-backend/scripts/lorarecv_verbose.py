#!/usr/bin/env python3
"""
lorarecv_verbose.py
Verbose LoRa serial receiver for Mac (and other OSes).
Usage: python3 lorarecv_verbose.py
"""


import serial
import time
import os
import sys
from datetime import datetime

# Disable Python buffering for real-time output
import io
sys.stdout = io.TextIOWrapper(open(sys.stdout.fileno(), 'wb', 0), write_through=True)

PORT = "/dev/cu.usbserial-0001"   # change if different
BAUD = 9600
RETRY_DELAY = 3.0


def list_ports():
    devs = sorted([f for f in os.listdir('/dev') if f.startswith('cu.')])
    return ["/dev/" + d for d in devs]


def open_serial(port, baud):
    try:
        ser = serial.Serial(port, baud, timeout=1)
        print(f"[{datetime.now()}] Opened {port} @ {baud}")
        return ser
    except Exception as e:
        print(f"[{datetime.now()}] ERROR opening {port}: {e}")
        return None


def main():
    print("Available serial ports:")
    for p in list_ports():
        print("  ", p)
    print("Using port:", PORT, "baud:", BAUD)
    ser = open_serial(PORT, BAUD)
    while ser is None:
        print(f"[{datetime.now()}] Will retry opening port in {RETRY_DELAY}s...")
        time.sleep(RETRY_DELAY)
        ser = open_serial(PORT, BAUD)


    try:
        while True:
            try:
                line = ser.readline()  # waits up to timeout
            except serial.SerialException as e:
                print(f"[{datetime.now()}] Serial exception: {e}")
                ser.close()
                ser = None
                # retry open
                while ser is None:
                    time.sleep(RETRY_DELAY)
                    ser = open_serial(PORT, BAUD)
                continue


            if line:
                # try decode
                try:
                    text = line.decode('utf-8', errors='replace').rstrip('\r\n')
                except Exception:
                    text = repr(line)
                ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
                print(f"[{ts}] {text}")
                sys.stdout.flush()  # Force flush to ensure data is sent immediately
            else:
                # no data within timeout
                # print a heartbeat every 15s so user knows script is alive
                now = time.time()
                if int(now) % 15 == 0:
                    # simple heartbeat once per second's window — harmless extra output
                    print(f"[{datetime.now()}] waiting for data...")
                    time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopped by user")
    finally:
        if ser and ser.is_open:
            ser.close()


if __name__ == "__main__":
    main()
