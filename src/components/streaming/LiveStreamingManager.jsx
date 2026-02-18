import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './LiveStreamingManager.css';

function LiveStreamingManager({ turnierId }) {
  const [channels, setChannels] = useState([]);
  const [activeStreams, setActiveStreams] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [viewers, setViewers] = useState(0);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [streamSettings, setStreamSettings] = useState({
    quality: '720p',
    bitrate: 2000,
    framerate: 30,
    audioEnabled: true,
    chatEnabled: true
  });
  
  const socketRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);

  // Socket.IO Connection
  useEffect(() => {
    const serverUrl = process.env.REACT_APP_API_URL || window.location.origin;
    socketRef.current = io(serverUrl, {
      transports: ['websocket', 'polling']
    });

    const socket = socketRef.current;

    // Socket Event Handlers
    socket.on('connect', () => {
      console.log('✅ Mit Streaming-Server verbunden');
    });

    socket.on('stream_started', (data) => {
      console.log('🎬 Stream gestartet:', data);
      setIsStreaming(true);
    });

    socket.on('stream_ended', (data) => {
      console.log('🛑 Stream beendet:', data);
      setIsStreaming(false);
      setViewers(0);
      setChatMessages([]);
    });

    socket.on('viewer_joined', (data) => {
      setViewers(data.current_viewers);
    });

    socket.on('viewer_left', (data) => {
      setViewers(data.current_viewers);
    });

    socket.on('chat_message', (message) => {
      setChatMessages(prev => [...prev, message]);
    });

    socket.on('webrtc_offer', async (data) => {
      await handleWebRTCOffer(data);
    });

    socket.on('webrtc_answer', async (data) => {
      await handleWebRTCAnswer(data);
    });

    socket.on('webrtc_ice_candidate', async (data) => {
      await handleICECandidate(data);
    });

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      socket.disconnect();
    };
  }, []);

  // Load streaming channels
  useEffect(() => {
    fetchChannels();
  }, [turnierId]);

  const fetchChannels = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || ''}/api/streaming/tournament/${turnierId}/channels`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setChannels(data);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Streaming-Kanäle:', error);
    }
  };

  // WebRTC Setup
  const setupWebRTC = async () => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: streamSettings.framerate }
        },
        audio: streamSettings.audioEnabled
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Create peer connection
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      peerConnectionRef.current = peerConnection;

      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          socketRef.current.emit('webrtc_ice_candidate', {
            channel_id: selectedChannel?.channel_id,
            candidate: event.candidate
          });
        }
      };

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      return peerConnection;

    } catch (error) {
      console.error('Fehler beim Setup von WebRTC:', error);
      throw error;
    }
  };

  const handleWebRTCOffer = async (data) => {
    try {
      const peerConnection = peerConnectionRef.current || await setupWebRTC();
      
      await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      socketRef.current.emit('webrtc_answer', {
        channel_id: data.channel_id,
        answer: answer,
        target_socket_id: data.from_socket_id
      });

    } catch (error) {
      console.error('Fehler beim Verarbeiten des WebRTC Offers:', error);
    }
  };

  const handleWebRTCAnswer = async (data) => {
    try {
      const peerConnection = peerConnectionRef.current;
      if (peerConnection) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
      }
    } catch (error) {
      console.error('Fehler beim Verarbeiten der WebRTC Answer:', error);
    }
  };

  const handleICECandidate = async (data) => {
    try {
      const peerConnection = peerConnectionRef.current;
      if (peerConnection) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    } catch (error) {
      console.error('Fehler beim Hinzufügen des ICE Candidates:', error);
    }
  };

  const startStream = async () => {
    if (!selectedChannel) {
      alert('Bitte wählen Sie einen Streaming-Kanal aus');
      return;
    }

    try {
      await setupWebRTC();

      // Create WebRTC offer
      const peerConnection = peerConnectionRef.current;
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      // Start stream session
      socketRef.current.emit('start_stream', {
        channel_id: selectedChannel.channel_id,
        session_name: `Live Stream - ${selectedChannel.channel_name}`,
        user_id: 1 // TODO: Get from auth context
      });

      // Send WebRTC offer
      socketRef.current.emit('webrtc_offer', {
        channel_id: selectedChannel.channel_id,
        offer: offer
      });

      // Update stream status to live
      setTimeout(() => {
        socketRef.current.emit('update_stream_status', {
          channel_id: selectedChannel.channel_id,
          status: 'live'
        });
      }, 2000);

    } catch (error) {
      console.error('Fehler beim Starten des Streams:', error);
      alert('Fehler beim Starten des Streams: ' + error.message);
    }
  };

  const stopStream = () => {
    if (selectedChannel && socketRef.current) {
      socketRef.current.emit('stop_stream', {
        channel_id: selectedChannel.channel_id
      });
    }

    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    setIsStreaming(false);
  };

  const sendChatMessage = () => {
    if (newMessage.trim() && socketRef.current && selectedChannel) {
      socketRef.current.emit('send_chat_message', {
        channel_id: selectedChannel.channel_id,
        message: newMessage.trim(),
        user_id: 1, // TODO: Get from auth context
        username: 'Streamer' // TODO: Get from auth context
      });
      setNewMessage('');
    }
  };

  const joinAsViewer = (channel) => {
    if (socketRef.current) {
      socketRef.current.emit('join_stream', {
        channel_id: channel.channel_id,
        user_id: 1, // TODO: Get from auth context
        viewer_info: {
          device_type: 'desktop',
          browser_type: navigator.userAgent.split(' ')[0]
        }
      });
      setSelectedChannel(channel);
    }
  };

  return (
    <div className="live-streaming-manager">
      <div className="streaming-header">
        <h2>Live-Streaming Verwaltung</h2>
        {isStreaming && (
          <div className="live-indicator">
            <span className="live-dot"></span>
            LIVE - {viewers} Zuschauer
          </div>
        )}
      </div>

      <div className="streaming-content">
        {/* Channel Selection */}
        <div className="channel-selection">
          <h3>Streaming-Kanäle</h3>
          <div className="channels-grid">
            {channels.map(channel => (
              <div 
                key={channel.channel_id} 
                className={`channel-card ${selectedChannel?.channel_id === channel.channel_id ? 'selected' : ''}`}
                onClick={() => setSelectedChannel(channel)}
              >
                <h4>{channel.channel_name}</h4>
                <p>Ring {channel.ring_number || 'Allgemein'}</p>
                <div className="channel-stats">
                  <span>👥 {channel.current_viewers || 0}</span>
                  <span className={channel.is_live ? 'live' : 'offline'}>
                    {channel.is_live ? '🔴 LIVE' : '⚫ OFFLINE'}
                  </span>
                </div>
                {channel.is_live && !isStreaming && (
                  <button 
                    className="btn btn-sm btn-outline-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      joinAsViewer(channel);
                    }}
                  >
                    Als Zuschauer beitreten
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {selectedChannel && (
          <div className="streaming-controls">
            <div className="video-section">
              {/* Local Video (Streamer) */}
              <div className="video-container">
                <h4>Ihre Kamera</h4>
                <video 
                  ref={localVideoRef}
                  autoPlay 
                  muted 
                  playsInline
                  className="video-preview"
                />
                <div className="video-controls">
                  {!isStreaming ? (
                    <button className="btn btn-success" onClick={startStream}>
                      🎬 Stream starten
                    </button>
                  ) : (
                    <button className="btn btn-danger" onClick={stopStream}>
                      🛑 Stream beenden
                    </button>
                  )}
                </div>
              </div>

              {/* Remote Video (Viewer) */}
              <div className="video-container">
                <h4>Live Stream</h4>
                <video 
                  ref={remoteVideoRef}
                  autoPlay 
                  playsInline
                  className="video-preview"
                />
              </div>
            </div>

            {/* Stream Settings */}
            <div className="stream-settings">
              <h4>Stream-Einstellungen</h4>
              <div className="settings-grid">
                <div className="setting-item">
                  <label>Qualität:</label>
                  <select 
                    value={streamSettings.quality}
                    onChange={(e) => setStreamSettings(prev => ({...prev, quality: e.target.value}))}
                  >
                    <option value="480p">480p</option>
                    <option value="720p">720p</option>
                    <option value="1080p">1080p</option>
                  </select>
                </div>
                <div className="setting-item">
                  <label>Framerate:</label>
                  <select 
                    value={streamSettings.framerate}
                    onChange={(e) => setStreamSettings(prev => ({...prev, framerate: parseInt(e.target.value)}))}
                  >
                    <option value={24}>24 FPS</option>
                    <option value={30}>30 FPS</option>
                    <option value={60}>60 FPS</option>
                  </select>
                </div>
                <div className="setting-item">
                  <label>
                    <input 
                      type="checkbox"
                      checked={streamSettings.audioEnabled}
                      onChange={(e) => setStreamSettings(prev => ({...prev, audioEnabled: e.target.checked}))}
                    />
                    Audio aktiviert
                  </label>
                </div>
                <div className="setting-item">
                  <label>
                    <input 
                      type="checkbox"
                      checked={streamSettings.chatEnabled}
                      onChange={(e) => setStreamSettings(prev => ({...prev, chatEnabled: e.target.checked}))}
                    />
                    Chat aktiviert
                  </label>
                </div>
              </div>
            </div>

            {/* Live Chat */}
            {streamSettings.chatEnabled && (
              <div className="live-chat">
                <h4>Live Chat</h4>
                <div className="chat-messages">
                  {chatMessages.map((message, index) => (
                    <div key={index} className="chat-message">
                      <span className="username">{message.username}:</span>
                      <span className="message">{message.message}</span>
                      <span className="timestamp">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="chat-input">
                  <input 
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                    placeholder="Nachricht eingeben..."
                  />
                  <button onClick={sendChatMessage}>Senden</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default LiveStreamingManager;