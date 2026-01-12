import React from 'react';

export interface DroneStatusData {
  id: string;
  lastSeen: string;
  status: 'online' | 'offline' | 'warning';
  batteryLevel: number;
  lastLocation: {
    latitude: number;
    longitude: number;
    altitude: number;
  };
  speed: number;
  heading: number;
}

interface DroneStatusProps {
  drone: DroneStatusData;
}

const DroneStatus: React.FC<DroneStatusProps> = ({ drone }) => {
  const getStatusColor = () => {
    switch (drone.status) {
      case 'online': return '#22c55e'; // green
      case 'warning': return '#f59e0b'; // amber
      case 'offline': return '#ef4444'; // red
      default: return '#6b7280'; // gray
    }
  };

  return (
    <div style={{
      backgroundColor: '#252d3d',
      border: `1px solid ${getStatusColor()}`,
      borderRadius: '8px',
      padding: '16px',
      color: '#ddd',
      flex: 1,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', textTransform: 'capitalize' }}>{drone.id.replace('_', ' ')}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: getStatusColor() }} />
          <span style={{ fontSize: '12px', fontWeight: '500', textTransform: 'capitalize' }}>{drone.status}</span>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '14px' }}>
        <div>
          <span style={{ color: '#aaa', fontSize: '12px' }}>Battery:</span> {drone.batteryLevel}%
        </div>
        <div>
          <span style={{ color: '#aaa', fontSize: '12px' }}>Speed:</span> {drone.speed.toFixed(1)} m/s
        </div>
        <div>
          <span style={{ color: '#aaa', fontSize: '12px' }}>Altitude:</span> {drone.lastLocation.altitude.toFixed(1)} m
        </div>
        <div>
          <span style={{ color: '#aaa', fontSize: '12px' }}>Heading:</span> {drone.heading.toFixed(0)}°
        </div>
      </div>
    </div>
  );
};

export default DroneStatus;
