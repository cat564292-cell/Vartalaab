import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Mic, Check, AlertCircle, Shield, Lock } from 'lucide-react';
import { Button } from './ui/button';

interface MicrophoneSetupProps {
  onPermissionGranted: () => void;
}

export function MicrophoneSetup({ onPermissionGranted }: MicrophoneSetupProps) {
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'checking'>('checking');
  const [isSecure, setIsSecure] = useState(true);

  useEffect(() => {
    checkPermissions();
    checkSecureContext();
  }, []);

  const checkSecureContext = () => {
    // Check if we're on HTTPS or localhost
    const isSecureContext = window.isSecureContext;
    setIsSecure(isSecureContext);
  };

  const checkPermissions = async () => {
    try {
      // Check if permissions API is available
      if (navigator.permissions && navigator.permissions.query) {
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        setPermissionState(result.state as any);
        
        // Listen for permission changes
        result.onchange = () => {
          setPermissionState(result.state as any);
          if (result.state === 'granted') {
            onPermissionGranted();
          }
        };
      } else {
        // Fallback for browsers that don't support permissions API
        setPermissionState('prompt');
      }
    } catch (error) {
      console.error('Error checking microphone permissions:', error);
      setPermissionState('prompt');
    }
  };

  const requestPermission = async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Stop the stream immediately - we just needed to request permission
      stream.getTracks().forEach(track => track.stop());
      
      setPermissionState('granted');
      onPermissionGranted();
    } catch (error: any) {
      console.error('Microphone permission denied:', error);
      setPermissionState('denied');
    }
  };

  if (!isSecure) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6 border border-red-500/30"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
            <Lock className="w-6 h-6 text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-medium mb-2">Secure Connection Required</h3>
            <p className="text-white/70 text-sm mb-4">
              Voice input requires HTTPS (secure connection) for security reasons. Your current connection is not secure.
            </p>
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-red-300 text-xs">
                <strong>Solution:</strong> Make sure your URL starts with <code className="bg-black/30 px-2 py-0.5 rounded">https://</code> or use <code className="bg-black/30 px-2 py-0.5 rounded">localhost</code> for testing.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (permissionState === 'denied') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6 border border-orange-500/30"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-6 h-6 text-orange-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-medium mb-2">Microphone Access Blocked</h3>
            <p className="text-white/70 text-sm mb-4">
              You've blocked microphone access. To use voice input, you need to enable it in your browser settings.
            </p>
            
            <div className="space-y-3 mb-4">
              <details className="bg-white/5 rounded-lg p-3">
                <summary className="text-white text-sm cursor-pointer font-medium">
                  🔧 Chrome/Edge Instructions
                </summary>
                <ol className="mt-3 space-y-2 text-xs text-white/70 list-decimal list-inside">
                  <li>Click the <strong className="text-white">lock icon (🔒)</strong> in the address bar</li>
                  <li>Find <strong className="text-white">"Microphone"</strong></li>
                  <li>Change to <strong className="text-white">"Allow"</strong></li>
                  <li>Refresh the page</li>
                </ol>
              </details>
              
              <details className="bg-white/5 rounded-lg p-3">
                <summary className="text-white text-sm cursor-pointer font-medium">
                  🔧 Safari Instructions
                </summary>
                <ol className="mt-3 space-y-2 text-xs text-white/70 list-decimal list-inside">
                  <li>Safari → Settings → Websites</li>
                  <li>Click <strong className="text-white">Microphone</strong></li>
                  <li>Find this website</li>
                  <li>Set to <strong className="text-white">"Allow"</strong></li>
                </ol>
              </details>
            </div>
            
            <Button
              onClick={() => window.location.reload()}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl"
            >
              Refresh Page After Enabling
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  if (permissionState === 'granted') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card rounded-2xl p-4 border border-green-500/30"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
            <Check className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h4 className="text-white font-medium text-sm">Microphone Ready</h4>
            <p className="text-white/60 text-xs">Click the microphone icon to start speaking</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6 border border-blue-500/30"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
          <Shield className="w-6 h-6 text-blue-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-white font-medium mb-2">Enable Voice Input</h3>
          <p className="text-white/70 text-sm mb-4">
            Grant microphone access to use voice translation features. Your audio is processed locally and never stored.
          </p>
          
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4">
            <ul className="space-y-1 text-xs text-white/70">
              <li>✓ Your voice is not recorded or saved</li>
              <li>✓ Audio is processed in your browser only</li>
              <li>✓ You can revoke access anytime</li>
            </ul>
          </div>
          
          <Button
            onClick={requestPermission}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl h-12 font-medium"
          >
            <Mic className="w-5 h-5 mr-2" />
            Allow Microphone Access
          </Button>
          
          <p className="text-xs text-white/50 text-center mt-3">
            Click to allow when your browser asks for permission
          </p>
        </div>
      </div>
    </motion.div>
  );
}
