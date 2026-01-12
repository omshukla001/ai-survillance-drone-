import axios from 'axios';

const API_URL = 'http://localhost:4000/api/detections';

// Sample drone locations (Bangalore area)
const droneLocations = [
  { latitude: 12.9716, longitude: 77.5946, source: 'drone_1' },
  { latitude: 12.9352, longitude: 77.6245, source: 'drone_2' },
  { latitude: 13.0827, longitude: 80.2707, source: 'drone_3' },
];

function getRandomDetection() {
  const location = droneLocations[Math.floor(Math.random() * droneLocations.length)];
  const peopleCount = Math.floor(Math.random() * 50) + 1;
  const timestamp = new Date().toISOString();

  return {
    latitude: location.latitude + (Math.random() - 0.5) * 0.01,
    longitude: location.longitude + (Math.random() - 0.5) * 0.01,
    peopleCount,
    timestamp,
    source: location.source,
  };
}

async function sendDetection() {
  try {
    const detection = getRandomDetection();
    console.log(`📤 Sending detection:`, detection);

    const response = await axios.post(API_URL, detection);
    console.log(`✅ Response (${response.status}):`, response.data);
  } catch (error: any) {
    console.error(`❌ Error:`, error.response?.data || error.message);
  }
}

async function main() {
  console.log('🚀 Mock Detection Sender Started');
  console.log(`📍 Target: ${API_URL}`);
  console.log('Sending random detections every 5 seconds...\n');

  // Send initial detection
  await sendDetection();

  // Send detections every 5 seconds
  setInterval(async () => {
    await sendDetection();
  }, 5000);
}

main().catch(console.error);
