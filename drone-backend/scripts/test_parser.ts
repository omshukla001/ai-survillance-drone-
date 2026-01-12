#!/usr/bin/env node
/**
 * Test the LoRa message parser
 */

// Test message from LoRa module
const testMessage = "COUNT:1,LAT:12.97190,LON:77.59370";

interface Detection {
  latitude: number;
  longitude: number;
  peopleCount: number;
  timestamp: string;
  source: string;
}

function parseLoRaMessage(message: string): Detection | null {
  try {
    let latitude: number | null = null;
    let longitude: number | null = null;
    let peopleCount: number | null = null;
    let source: string = 'lora_module';

    // Try LoRa module format: COUNT:X,LAT:Y,LON:Z
    if (message.includes('COUNT:') && message.includes('LAT:') && message.includes('LON:')) {
      const pairs = message.split(',');
      for (const pair of pairs) {
        const [key, value] = pair.split(':');
        if (!key || !value) continue;

        const k = key.trim().toUpperCase();
        const v = value.trim();

        if (k === 'COUNT') peopleCount = parseInt(v, 10);
        else if (k === 'LAT') latitude = parseFloat(v);
        else if (k === 'LON') longitude = parseFloat(v);
        else if (k === 'SOURCE') source = v;
      }
    }

    // Validate parsed data
    if (
      latitude === null ||
      longitude === null ||
      peopleCount === null ||
      isNaN(latitude) ||
      isNaN(longitude) ||
      isNaN(peopleCount)
    ) {
      return null;
    }

    const detection: Detection = {
      latitude,
      longitude,
      peopleCount,
      timestamp: new Date().toISOString(),
      source,
    };

    return detection;
  } catch (error) {
    console.error('[Parse Error]', error instanceof Error ? error.message : error);
    return null;
  }
}

console.log('Testing LoRa message parser...');
console.log(`Input: "${testMessage}"`);

const result = parseLoRaMessage(testMessage);

if (result) {
  console.log('✅ Parse successful!');
  console.log('Result:', result);
} else {
  console.log('❌ Parse failed!');
}
