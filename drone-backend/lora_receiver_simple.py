#!/usr/bin/env python3
import serial
import time
from datetime import datetime

# -------------------------------
# CONFIG (Mac example)
# -------------------------------
SERIAL_PORT = "/dev/cu.usbserial-0001"   # change if needed
BAUD_RATE = 9600

def main():
    try:
        ser = serial.Serial(
            port=SERIAL_PORT,
            baudrate=BAUD_RATE,
            timeout=1
        )
        print(f"✅ LoRa receiver listening on {SERIAL_PORT} @ {BAUD_RATE}")
    except Exception as e:
        print("❌ Failed to open serial port:", e)
        return

    while True:
        try:
            line = ser.readline()
            if not line:
                continue

            text = line.decode("utf-8", errors="replace").strip()
            ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            print(f"[{ts}] RAW → {text}")

            # Parse expected message format
            # CNT:x,LAT:y,LON:z
            if text.startswith("CNT:"):
                data = {}
                for part in text.split(","):
                    k, v = part.split(":")
                    data[k] = v

                count = int(data.get("CNT", -1))
                lat = float(data.get("LAT", 0))
                lon = float(data.get("LON", 0))

                print(f"    👤 Humans : {count}")
                print(f"    📍 GPS    : {lat}, {lon}")

        except KeyboardInterrupt:
            print("\n🛑 Receiver stopped")
            break
        except Exception as e:
            print("⚠️ Error:", e)
            time.sleep(1)

if __name__ == "__main__":
    main()
