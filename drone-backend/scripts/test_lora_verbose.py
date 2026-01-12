#!/usr/bin/env python3
"""
Verbose LoRa test - continuously monitor for data
"""

import serial
import time
from datetime import datetime

PORT = "/dev/cu.usbserial-0001"
BAUD = 9600

print(f"[{datetime.now()}] 🔍 LoRa Module Diagnostic Test")
print(f"[{datetime.now()}] Port: {PORT}")
print(f"[{datetime.now()}] Baud Rate: {BAUD}")
print(f"[{datetime.now()}] Listening continuously (Ctrl+C to stop)...")
print("-" * 80)

try:
    ser = serial.Serial(PORT, BAUD, timeout=2)
    print(f"[{datetime.now()}] ✅ Serial port opened successfully")
    print(f"[{datetime.now()}] Port settings: {ser.get_settings() if hasattr(ser, 'get_settings') else 'N/A'}")
    print("-" * 80)
    
    message_count = 0
    last_message_time = None
    
    while True:
        try:
            line = ser.readline()
            
            if line:
                text = line.decode('utf-8', errors='replace').rstrip('\r\n')
                message_count += 1
                last_message_time = datetime.now()
                print(f"[{last_message_time}] 📨 MESSAGE #{message_count}: {text}")
                print(f"                    Raw bytes: {line}")
                print(f"                    Length: {len(line)} bytes")
            else:
                # Timeout - no data
                print(f"[{datetime.now()}] ⏳ Waiting for data... (messages received so far: {message_count})")
                
        except Exception as e:
            print(f"[{datetime.now()}] ❌ Error: {e}")
            time.sleep(1)
            
except KeyboardInterrupt:
    print(f"\n[{datetime.now()}] ⏹️  Stopped by user")
    if message_count > 0:
        print(f"✅ Received {message_count} messages total")
        if last_message_time:
            print(f"   Last message: {last_message_time}")
    else:
        print(f"⚠️  No messages received")
        
except Exception as e:
    print(f"[{datetime.now()}] ❌ FATAL ERROR: {e}")
    
finally:
    if 'ser' in locals() and ser.is_open:
        ser.close()
        print(f"[{datetime.now()}] Port closed")
