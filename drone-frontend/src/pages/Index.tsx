import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion'; // Add this import
import { 
  Radio, 
  Users, 
  MapPin, 
  Clock, 
  Activity, 
  AlertTriangle,
  Plane,
  Package,
  Eye,
  Wifi,
  WifiOff,
  ChevronRight,
  Trash2,
  Filter,
  Zap,
  Navigation,
  Target,
  Shield
} from 'lucide-react';
import { fetchDetections, connectToStream, clearDetections, fetchDroneStatus } from '../lib/api';
import { Detection, FilterState, TimeRange, DroneStatusData } from '../lib/types';
import { formatTimestamp, formatCoords } from '../lib/utils';
import MapWrapper from '../components/MapWrapper';
import VideoFeed from '../components/VideoFeed';
import '../styles/skyrelief.css';

// FIXED: Properly typed animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.5, 
      ease: "easeOut" as const // Add "as const"
    }
  }
};

const pulseVariants: Variants = {
  pulse: {
    scale: [1, 1.05, 1],
    opacity: [0.7, 1, 0.7],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut" as const
    }
  }
};

const glowVariants: Variants = {
  glow: {
    boxShadow: [
      "0 0 20px rgba(6, 182, 212, 0.3)",
      "0 0 40px rgba(6, 182, 212, 0.5)",
      "0 0 20px rgba(6, 182, 212, 0.3)"
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut" as const
    }
  }
};

function filterByTimeRange(detections: Detection[], timeRange: TimeRange): Detection[] {
  if (timeRange === 'all') return detections;
  
  const now = Date.now();
  const ranges: Record<Exclude<TimeRange, 'all'>, number> = {
    '10min': 10 * 60 * 1000,
    '1hr': 60 * 60 * 1000,
    '24hr': 24 * 60 * 60 * 1000,
  };
  
  const cutoff = now - ranges[timeRange];
  return detections.filter(d => new Date(d.timestamp).getTime() >= cutoff);
}

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: '10min', label: '10 min' },
  { value: '1hr', label: '1 hr' },
  { value: '24hr', label: '24 hr' },
  { value: 'all', label: 'All' },
];

// Animated Counter Component
const AnimatedCounter = ({ value, duration = 1 }: { value: number; duration?: number }) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    let startValue = displayValue;
    const startTime = Date.now();
    const endTime = startTime + duration * 1000;
    
    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / (endTime - startTime), 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic
      setDisplayValue(Math.floor(startValue + (value - startValue) * easeProgress));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [value, displayValue, duration]);
  
  return <span>{displayValue}</span>;
};

// Live Time Component
const LiveTime = () => {
  const [time, setTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  return (
    <div className="live-time">
      <Clock size={14} />
      <span>{time.toLocaleTimeString('en-US', { hour12: false })}</span>
      <span className="date">{time.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
    </div>
  );
};

// Status Indicator Component
const StatusIndicator = ({ status, label }: { status: 'online' | 'offline' | 'warning'; label: string }) => {
  const colors = {
    online: '#10b981',
    offline: '#ef4444',
    warning: '#f59e0b'
  };
  
  return (
    <div className="status-indicator">
      <motion.div 
        className="status-dot"
        style={{ backgroundColor: colors[status] }}
        animate={{ 
          boxShadow: status === 'online' 
            ? [`0 0 0 0 ${colors[status]}40`, `0 0 0 8px ${colors[status]}00`]
            : 'none'
        }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      <span>{label}</span>
    </div>
  );
};

// Detection Card Component
const DetectionCard = ({ 
  detection, 
  isSelected, 
  onClick,
  index 
}: { 
  detection: Detection; 
  isSelected: boolean; 
  onClick: () => void;
  index: number;
}) => {
  const severityColor = detection.peopleCount <= 3 
    ? 'var(--success)' 
    : detection.peopleCount <= 10 
      ? 'var(--warning)' 
      : 'var(--danger)';
      
  const severityBg = detection.peopleCount <= 3 
    ? 'var(--success-bg)' 
    : detection.peopleCount <= 10 
      ? 'var(--warning-bg)' 
      : 'var(--danger-bg)';

  return (
    <motion.div
      className={`detection-card ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ scale: 1.02, x: 5 }}
      whileTap={{ scale: 0.98 }}
      layout
    >
      <div className="detection-card-accent" style={{ backgroundColor: severityColor }} />
      <div className="detection-card-content">
        <div className="detection-header">
          <div className="detection-time">
            <Clock size={12} />
            <span>{formatTimestamp(detection.timestamp)}</span>
          </div>
          <motion.div 
            className="people-badge"
            style={{ backgroundColor: severityBg, color: severityColor }}
            whileHover={{ scale: 1.1 }}
          >
            <Users size={12} />
            <span>{detection.peopleCount}</span>
          </motion.div>
        </div>
        <div className="detection-coords">
          <MapPin size={12} />
          <span>{formatCoords(detection.latitude, detection.longitude)}</span>
        </div>
        <div className="detection-source">
          <Radio size={12} />
          <span>Scout Drone</span>
        </div>
      </div>
      <ChevronRight className="detection-arrow" size={16} />
    </motion.div>
  );
};

// Drone Status Card Component - FIXED: Use correct DroneStatusData properties
const DroneStatusCard = ({ 
  name, 
  type, 
  status,
  batteryLevel,
  altitude, 
  speed,
  hasCamera = false 
}: { 
  name: string;
  type: 'scout' | 'delivery';
  status: 'online' | 'offline' | 'warning';
  batteryLevel: number;
  altitude: number;
  speed: number;
  hasCamera?: boolean;
}) => {
  const Icon = type === 'scout' ? Eye : Package;
  const isOnline = status !== 'offline';
  
  return (
    <motion.div 
      className={`drone-status-card ${type}`}
      variants={itemVariants}
      whileHover={{ scale: 1.02 }}
    >
      <div className="drone-header">
        <div className="drone-icon-wrapper">
          <Icon size={20} />
          {hasCamera && (
            <motion.div 
              className="camera-indicator"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <div className="rec-dot" />
              <span>REC</span>
            </motion.div>
          )}
        </div>
        <div className="drone-info">
          <h4>{name}</h4>
          <span className="drone-type">{type === 'scout' ? 'Surveillance Unit' : 'Relief Delivery Unit'}</span>
        </div>
        <div className={`drone-status ${isOnline ? 'online' : 'offline'}`}>
          {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
          <span>{isOnline ? 'Online' : 'Offline'}</span>
        </div>
      </div>
      
      <div className="drone-telemetry">
        <div className="telemetry-item">
          <div className="telemetry-label">
            <Zap size={12} />
            <span>Battery</span>
          </div>
          <div className="telemetry-value">
            <div className="battery-bar">
              <motion.div 
                className="battery-fill"
                initial={{ width: 0 }}
                animate={{ width: `${batteryLevel}%` }}
                style={{ 
                  backgroundColor: batteryLevel > 50 ? 'var(--success)' : batteryLevel > 20 ? 'var(--warning)' : 'var(--danger)'
                }}
              />
            </div>
            <span>{batteryLevel}%</span>
          </div>
        </div>
        <div className="telemetry-item">
          <div className="telemetry-label">
            <Navigation size={12} />
            <span>Altitude</span>
          </div>
          <span className="telemetry-value">{altitude}m</span>
        </div>
        <div className="telemetry-item">
          <div className="telemetry-label">
            <Activity size={12} />
            <span>Speed</span>
          </div>
          <span className="telemetry-value">{speed} km/h</span>
        </div>
      </div>
    </motion.div>
  );
};

// Stat Card Component
const StatCard = ({ 
  icon: Icon, 
  label, 
  value, 
  color,
  suffix = '' 
}: { 
  icon: any; 
  label: string; 
  value: number; 
  color: string;
  suffix?: string;
}) => (
  <motion.div 
    className="stat-card"
    variants={itemVariants}
    whileHover={{ scale: 1.05, y: -5 }}
  >
    <div className="stat-icon" style={{ backgroundColor: `${color}20`, color }}>
      <Icon size={20} />
    </div>
    <div className="stat-content">
      <span className="stat-value" style={{ color }}>
        <AnimatedCounter value={value} />
        {suffix}
      </span>
      <span className="stat-label">{label}</span>
    </div>
  </motion.div>
);

const Index = () => {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [isLive, setIsLive] = useState(true);
  const [selectedDetection, setSelectedDetection] = useState<Detection | null>(null);
  const [droneStatuses, setDroneStatuses] = useState<Record<string, DroneStatusData>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    minPeopleCount: 0,
    timeRange: 'all',
  });

  const handleClearDetections = async () => {
    const ok = await clearDetections();
    if (ok) {
      setDetections([]);
      setSelectedDetection(null);
    }
  };

  useEffect(() => {
    const statusInterval = setInterval(() => {
      fetchDroneStatus().then(setDroneStatuses);
    }, 2000);
    return () => clearInterval(statusInterval);
  }, []);

  useEffect(() => {
    const handleNewDetection = (detection: Detection) => {
      setDetections(prev => {
        if (prev.some(d => d.id === detection.id)) return prev;
        return [detection, ...prev];
      });
    };

    fetchDetections().then(initialDetections => {
      setDetections(initialDetections);
      if (isLive) {
        const eventSource = connectToStream(handleNewDetection);
        return () => eventSource?.close();
      }
    });
  }, [isLive]);

  const filteredDetections = useMemo(() => {
    let result = filterByTimeRange(detections, filters.timeRange);
    return result.filter(d => d.peopleCount >= filters.minPeopleCount);
  }, [detections, filters]);

  const sortedDetections = useMemo(() => {
    return [...filteredDetections].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [filteredDetections]);

  const stats = useMemo(() => {
    const totalPeople = filteredDetections.reduce((sum, d) => sum + d.peopleCount, 0);
    const maxPeople = filteredDetections.length > 0 
      ? Math.max(...filteredDetections.map(d => d.peopleCount))
      : 0;
    // FIXED: Use correct property name
    const onlineDrones = Object.values(droneStatuses).filter(d => d.status !== 'offline').length;
    return { 
      totalDetections: filteredDetections.length, 
      totalPeople,
      maxPeople, 
      onlineDrones 
    };
  }, [filteredDetections, droneStatuses]);

  // FIXED: Use correct DroneStatusData properties
  const scoutDrone = {
    name: 'Scout Drone',
    type: 'scout' as const,
    status: droneStatuses['drone_1']?.status ?? 'online' as const,
    batteryLevel: droneStatuses['drone_1']?.batteryLevel ?? 85,
    altitude: droneStatuses['drone_1']?.lastLocation?.altitude ?? 120,
    speed: droneStatuses['drone_1']?.speed ?? 25,
    hasCamera: true
  };

  const deliveryDrone = {
    name: 'Delivery Drone',
    type: 'delivery' as const,
    status: droneStatuses['drone_2']?.status ?? 'online' as const,
    batteryLevel: droneStatuses['drone_2']?.batteryLevel ?? 72,
    altitude: droneStatuses['drone_2']?.lastLocation?.altitude ?? 80,
    speed: droneStatuses['drone_2']?.speed ?? 18
  };

  return (
    <div className="skyrelief-container">
      {/* Animated Background */}
      <div className="background-effects">
        <div className="gradient-orb orb-1" />
        <div className="gradient-orb orb-2" />
        <div className="grid-overlay" />
      </div>

      {/* Header */}
      <motion.header 
        className="main-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="header-left">
          <motion.div 
            className="logo"
            whileHover={{ scale: 1.05 }}
          >
            <div className="logo-icon">
              <Shield size={28} />
            </div>
            <div className="logo-text">
              <h1>SkyRelief</h1>
              <span>Aerial Disaster Response System</span>
            </div>
          </motion.div>
        </div>

        <div className="header-center">
          <motion.div 
            className="live-badge"
            animate={isLive ? { opacity: [1, 0.7, 1] } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <div className={`live-dot ${isLive ? 'active' : ''}`} />
            <span>{isLive ? 'LIVE' : 'PAUSED'}</span>
          </motion.div>
          <StatusIndicator status={scoutDrone.status} label="Scout" />
          <StatusIndicator status={deliveryDrone.status} label="Delivery" />
        </div>

        <div className="header-right">
          <div className="team-badge">
            <span className="team-label">Team ID</span>
            <span className="team-id">N252991</span>
          </div>
          <LiveTime />
        </div>
      </motion.header>

      {/* Main Content */}
      <motion.main 
        className="main-content"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Left Panel - Detections */}
        <motion.aside className="detections-panel" variants={itemVariants}>
          <div className="panel-header">
            <div className="panel-title">
              <Target size={18} />
              <h2>Detection Feed</h2>
              <span className="detection-count">{sortedDetections.length}</span>
            </div>
            <div className="panel-actions">
              <motion.button 
                className="icon-button"
                onClick={() => setShowFilters(!showFilters)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Filter size={16} />
              </motion.button>
              <motion.button 
                className="icon-button danger"
                onClick={handleClearDetections}
                disabled={detections.length === 0}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Trash2 size={16} />
              </motion.button>
            </div>
          </div>

          {/* Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div 
                className="filters-section"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="filter-group">
                  <label>Min. People: <span>{filters.minPeopleCount}+</span></label>
                  <input 
                    type="range" 
                    min="0" 
                    max="50" 
                    value={filters.minPeopleCount}
                    onChange={(e) => setFilters({ ...filters, minPeopleCount: parseInt(e.target.value) })}
                  />
                </div>
                <div className="filter-group">
                  <label>Time Range</label>
                  <div className="time-range-buttons">
                    {TIME_RANGES.map(({ value, label }) => (
                      <button 
                        key={value}
                        className={filters.timeRange === value ? 'active' : ''}
                        onClick={() => setFilters({ ...filters, timeRange: value })}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Detection List */}
          <div className="detections-list">
            <AnimatePresence>
              {sortedDetections.map((detection, index) => (
                <DetectionCard
                  key={detection.id}
                  detection={detection}
                  isSelected={selectedDetection?.id === detection.id}
                  onClick={() => setSelectedDetection(detection)}
                  index={index}
                />
              ))}
            </AnimatePresence>
            
            {sortedDetections.length === 0 && (
              <motion.div 
                className="empty-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <AlertTriangle size={48} />
                <p>No detections found</p>
                <span>Waiting for drone feed...</span>
              </motion.div>
            )}
          </div>
        </motion.aside>

        {/* Center - Map */}
        <motion.section className="map-section" variants={itemVariants}>
          <div className="map-container">
            <MapWrapper 
              detections={filteredDetections} 
              selectedDetection={selectedDetection} 
              onMarkerClick={setSelectedDetection} 
              droneStatuses={droneStatuses} 
            />
            
            {/* Map Overlay Stats */}
            <div className="map-overlay-stats">
              <StatCard 
                icon={Target} 
                label="Detections" 
                value={stats.totalDetections} 
                color="#06b6d4" 
              />
              <StatCard 
                icon={Users} 
                label="People Found" 
                value={stats.totalPeople} 
                color="#8b5cf6" 
              />
              <StatCard 
                icon={Plane} 
                label="Drones Online" 
                value={stats.onlineDrones} 
                color="#10b981" 
              />
              <StatCard 
                icon={AlertTriangle} 
                label="Max Group" 
                value={stats.maxPeople} 
                color="#f59e0b"
                suffix=" ppl" 
              />
            </div>

            {/* Selected Detection Info */}
            <AnimatePresence>
              {selectedDetection && (
                <motion.div 
                  className="selected-detection-overlay"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                >
                  <div className="selected-header">
                    <MapPin size={16} />
                    <span>Selected Location</span>
                  </div>
                  <div className="selected-coords">
                    <div className="coord">
                      <span className="label">LAT</span>
                      <span className="value">{selectedDetection.latitude.toFixed(6)}°</span>
                    </div>
                    <div className="coord">
                      <span className="label">LNG</span>
                      <span className="value">{selectedDetection.longitude.toFixed(6)}°</span>
                    </div>
                    <div className="coord people">
                      <span className="label">PEOPLE</span>
                      <span className="value">{selectedDetection.peopleCount}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.section>

        {/* Right Panel - Drone Status & Video */}
        <motion.aside className="drones-panel" variants={itemVariants}>
          {/* Scout Drone with Video */}
          <div className="drone-section scout">
            <DroneStatusCard {...scoutDrone} />
            <motion.div 
              className="video-feed-wrapper"
              variants={glowVariants}
              animate="glow"
            >
              <div className="video-header">
                <div className="video-title">
                  <Eye size={14} />
                  <span>Live Camera Feed</span>
                </div>
                <motion.div 
                  className="recording-badge"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <div className="rec-dot" />
                  <span>REC</span>
                </motion.div>
              </div>
              <div className="video-container">
                <VideoFeed droneId="drone_1" />
              </div>
            </motion.div>
          </div>

          {/* Delivery Drone */}
          <div className="drone-section delivery">
            <DroneStatusCard {...deliveryDrone} />
            <div className="delivery-status">
              <div className="delivery-info">
                <Package size={24} />
                <div>
                  <span className="status-label">Payload Status</span>
                  <span className="status-value">Ready for Deployment</span>
                </div>
              </div>
              <motion.button 
                className="deploy-button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Deploy Relief
              </motion.button>
            </div>
          </div>
        </motion.aside>
      </motion.main>

      {/* Footer */}
      <motion.footer 
        className="main-footer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <div className="footer-left">
          <span>SkyRelief v1.0</span>
          <span className="separator">•</span>
          <span>Aerial Disaster Response System</span>
        </div>
        <div className="footer-center">
          <span>Developed for National Defense Innovation Challenge</span>
        </div>
        <div className="footer-right">
          <span>Team ID: N252991</span>
        </div>
      </motion.footer>
    </div>
  );
};

export default Index;