import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getVideoUrl, saveVideoUrl } from '../lib/storage';

interface VideoControlsProps {
  isPlaying: boolean;
  isMuted: boolean;
  isFullscreen: boolean;
  currentTime: number;
  duration: number;
  onPlayPause: () => void;
  onMuteToggle: () => void;
  onFullscreenToggle: () => void;
  onSeek: (time: number) => void;
  show: boolean;
}

const VideoControls: React.FC<VideoControlsProps> = ({
  isPlaying,
  isMuted,
  isFullscreen,
  currentTime,
  duration,
  onPlayPause,
  onMuteToggle,
  onFullscreenToggle,
  onSeek,
  show
}) => {
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
        padding: '16px 8px 8px',
        display: 'flex',
        flexDirection: 'column',
        opacity: show ? 1 : 0,
        transition: 'opacity 0.3s ease',
        zIndex: 10,
        pointerEvents: 'auto'
      }}
      className="video-controls"
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <input
          type="range"
          min="0"
          max={duration || 100}
          value={currentTime}
          onChange={(e) => onSeek(Number(e.target.value))}
          style={{ flex: 1, height: '4px', borderRadius: '2px' }}
        />
        <div style={{ color: 'white', fontSize: '12px', minWidth: '80px', textAlign: 'right' }}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onPlayPause}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px'
            }}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? '⏸️' : '▶️'}
          </button>
          <button
            onClick={onMuteToggle}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px'
            }}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>
        <button
          onClick={onFullscreenToggle}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px'
          }}
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? '⤵️' : '⤴️'}
        </button>
      </div>
    </div>
  );
};

interface VideoFeedProps {
  droneId: string;
}

const VideoFeed: React.FC<VideoFeedProps> = ({ droneId }) => {
  // State management
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [inputUrl, setInputUrl] = useState('');
  const [isError, setIsError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  // Refs
  const videoRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  const retryTimeoutRef = useRef<NodeJS.Timeout>();

  // Toggle fullscreen mode
  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Error toggling fullscreen:', err);
    }
  }, []);

  // Handle mouse movement to show/hide controls
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);

  // Handle retry loading video
  const handleRetry = useCallback(() => {
    setRetryCount(prev => prev + 1);
    setIsError(false);
    setIsLoading(true);
  }, []);

  // Handle saving video URL
  const handleSave = useCallback(() => {
    if (!inputUrl.trim()) return;
    
    const url = inputUrl.trim();
    setVideoUrl(url);
    saveVideoUrl(droneId, url);
    setIsEditing(false);
    setIsError(false);
    setIsLoading(true);
    setRetryCount(0);
  }, [inputUrl, droneId]);

  // Load saved video URL on component mount and retry
  useEffect(() => {
    const savedUrl = getVideoUrl(droneId);
    if (savedUrl) {
      setVideoUrl(savedUrl);
      setInputUrl(savedUrl);
      setIsLoading(true);
      setIsError(false);
    }
  }, [droneId, retryCount]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showControls) return;
      
      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          setIsPlaying(prev => !prev);
          break;
        case 'm':
          setIsMuted(prev => !prev);
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'arrowleft':
          setCurrentTime(prev => Math.max(0, prev - 5));
          break;
        case 'arrowright':
          setCurrentTime(prev => Math.min(duration, prev + 5));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showControls, duration, toggleFullscreen]);

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Auto-hide controls after delay
  useEffect(() => {
    if (showControls) {
      clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls]);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Handle video load/error events
  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setIsError(false);
    setRetryCount(0);
  }, []);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setIsError(true);
  }, []);

  // Render loading state
  const renderLoadingState = () => (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#000',
      color: '#fff',
      zIndex: 5
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '4px solid rgba(255, 255, 255, 0.3)',
        borderTopColor: '#fff',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '16px'
      }} />
      <p>Loading video feed...</p>
    </div>
  );

  // Render error state
  const renderErrorState = () => (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#000',
      color: '#ff6b6b',
      padding: '20px',
      textAlign: 'center',
      zIndex: 5
    }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
      <h3 style={{ margin: '0 0 8px' }}>Unable to load video feed</h3>
      <p style={{ margin: '0 0 16px', opacity: 0.8 }}>
        {retryCount > 0 
          ? `Still having trouble connecting (attempt ${retryCount + 1})` 
          : 'The video feed could not be loaded. Please check the URL and try again.'}
      </p>
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={handleRetry}
          style={{
            padding: '8px 16px',
            backgroundColor: '#4a90e2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          {retryCount > 0 ? 'Retry' : 'Try Again'}
        </button>
        <button
          onClick={() => setIsEditing(true)}
          style={{
            padding: '8px 16px',
            backgroundColor: 'transparent',
            color: '#4a90e2',
            border: '1px solid #4a90e2',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          Change URL
        </button>
      </div>
    </div>
  );

  // Render URL input form
  const renderUrlForm = () => (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f5f5f5',
      padding: '20px',
      zIndex: 5
    }}>
      <h3 style={{ margin: '0 0 16px' }}>Enter Video Stream URL</h3>
      <input
        type="text"
        value={inputUrl}
        onChange={(e) => setInputUrl(e.target.value)}
        placeholder="https://example.com/stream"
        style={{
          width: '100%',
          maxWidth: '500px',
          padding: '12px',
          marginBottom: '16px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          fontSize: '14px'
        }}
        onKeyPress={(e) => e.key === 'Enter' && handleSave()}
      />
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={handleSave}
          disabled={!inputUrl.trim()}
          style={{
            padding: '8px 24px',
            backgroundColor: '#4a90e2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            opacity: inputUrl.trim() ? 1 : 0.6,
            transition: 'opacity 0.2s'
          }}
        >
          Save
        </button>
        <button
          onClick={() => {
            setIsEditing(false);
            if (!videoUrl) {
              setInputUrl('');
            }
          }}
          style={{
            padding: '8px 24px',
            backgroundColor: 'transparent',
            color: '#666',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );

  // Render empty state (no video URL configured)
  const renderEmptyState = () => (
    <div 
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        cursor: 'pointer',
        zIndex: 5
      }}
      onClick={() => setIsEditing(true)}
    >
      <div style={{
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        backgroundColor: '#e0e0e0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '16px',
        transition: 'all 0.2s ease'
      } as React.CSSProperties}>
        <span style={{ fontSize: '32px' }}>+</span>
      </div>
      <h3 style={{ margin: '0 0 8px' }}>Add Video Feed</h3>
      <p style={{ margin: 0, color: '#666' }}>Click to set up your video feed URL</p>
    </div>
  );

  // Render the main content
  const renderContent = () => {
    if (isEditing) {
      return renderUrlForm();
    }

    if (isLoading) {
      return renderLoadingState();
    }

    if (isError) {
      return renderErrorState();
    }

    if (!videoUrl) {
      return renderEmptyState();
    }

    return (
      <>
        <iframe
          ref={videoRef}
          src={videoUrl}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            backgroundColor: '#000',
            display: isError ? 'none' : 'block'
          }}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          onLoad={handleLoad}
          onError={handleError}
        />
        
        {isLoading && renderLoadingState()}
        {isError && renderErrorState()}
        
        <VideoControls
          isPlaying={isPlaying}
          isMuted={isMuted}
          isFullscreen={isFullscreen}
          currentTime={currentTime}
          duration={duration}
          onPlayPause={() => setIsPlaying(prev => !prev)}
          onMuteToggle={() => setIsMuted(prev => !prev)}
          onFullscreenToggle={toggleFullscreen}
          onSeek={(time) => setCurrentTime(time)}
          show={showControls}
        />
      </>
    );
  };

  return (
    <div 
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '300px',
        backgroundColor: '#000',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowControls(false)}
      onClick={() => setShowControls(prev => !prev)}
    >
      {renderContent()}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default VideoFeed;