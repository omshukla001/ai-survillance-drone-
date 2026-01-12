#!/usr/bin/env python3
"""
Test script to check if LoRa module is sending data
"""

import serial
import time
from datetime import datetime

PORT = "/dev/cu.usbserial-0001"
BAUD = 9600

print(f"[{datetime.now()}] Testing LoRa connection on {PORT} @ {BAUD} baud...")
print(f"[{datetime.now()}] Listening for 15 seconds...")

try:
    ser = serial.Serial(PORT, BAUD, timeout=1)
    print(f"[{datetime.now()}] ✅ Port opened successfully!")
    
    start_time = time.time()
    data_received = False
    
    while time.time() - start_time < 15:
        try:
            line = ser.readline()
            if line:
                text = line.decode('utf-8', errors='replace').rstrip('\r\n')
                print(f"[{datetime.now()}] 📨 DATA RECEIVED: {text}")
                data_received = True
            else:
                elapsed = int(time.time() - start_time)
                print(f"[{datetime.now()}] ⏳ Waiting... ({elapsed}s elapsed, no data yet)")
                time.sleep(1)
        except Exception as e:
            print(f"[{datetime.now()}] ❌ Error reading: {e}")
            break
    
    ser.close()
    
    if data_received:
        print(f"\n✅ SUCCESS: LoRa module is sending data!")
    else:
        print(f"\n⚠️  WARNING: No data received from LoRa module in 15 seconds")
        print("   - Check if LoRa module is powered on")
        print("   - Check if LoRa module is configured to send data")
        print("   - Check USB cable connection")
        print("   - Verify port is correct: /dev/cu.usbserial-0001")
        
except FileNotFoundError:
    print(f"❌ ERROR: Port {PORT} not found!")
    print("   Available ports:")
    import os
    for p in sorted([f for f in os.listdir('/dev') if f.startswith('cu.')]):
        print(f"   - /dev/{p}")
except Exception as e:
    print(f"❌ ERROR: {e}")
