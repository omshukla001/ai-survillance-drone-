import React, { useState, useEffect, useRef, useCallback } from 'react';

interface VideoFeedProps {
  droneId: string;
  onStreamStart?: () => void;
}

const VideoFeed: React.FC<VideoFeedProps> = ({ droneId, onStreamStart }) => {
  // State management
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false); // Start false, wait for click
  const [isActivated, setIsActivated] = useState(false); // New state for activation
  const [inputUrl, setInputUrl] = useState('');
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Refs
  const videoRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
    setIsEditing(false);
    setIsActivated(true);
    setIsError(false);
    setIsLoading(true);
    setRetryCount(0);
    if (onStreamStart) onStreamStart();
  }, [inputUrl, onStreamStart]);

  // Force clear loading state after a timeout (handling MJPEG streams that never fire onLoad)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (isLoading && videoUrl) {
      timeoutId = setTimeout(() => {
        setIsLoading(false);
      }, 2000); // 2 seconds timeout to clear loader
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isLoading, videoUrl]);

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

  // Render empty state (placeholder)
  const renderEmptyState = () => (
    <div
      onClick={() => setIsEditing(true)}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: '#fff',
        backgroundColor: '#0f172a',
        transition: 'background-color 0.2s ease'
      } as React.CSSProperties}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1e293b')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0f172a')}
    >
      <div style={{
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        backgroundColor: 'rgba(6, 182, 212, 0.1)',
        border: '1px solid var(--accent-cyan)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '16px',
        color: 'var(--accent-cyan)'
      } as React.CSSProperties}>
        <span style={{ fontSize: '24px' }}>📡</span>
      </div>
      <h3 style={{ margin: '0 0 8px', color: 'var(--accent-cyan)' }}>Offline</h3>
    </div>
  );

  // Render the main content
  const renderContent = () => {
    if (isEditing) {
      return renderUrlForm();
    }

    if (!videoUrl) {
      return renderEmptyState();
    }

    return (
      <>
        <img
          ref={videoRef as any}
          src={videoUrl}
          alt="Live Drone Feed"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover', // Fill the container completely
            display: isError ? 'none' : 'block'
          }}
          onLoad={handleLoad}
          onError={handleError}
        />

        {isLoading && renderLoadingState()}
        {isError && renderErrorState()}
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