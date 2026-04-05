import { motion, AnimatePresence } from 'motion/react';
import { X, Mic, Chrome, Globe, Settings, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';

interface MicrophonePermissionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
}

export function MicrophonePermissionDialog({ isOpen, onClose, onRetry }: MicrophonePermissionDialogProps) {
  const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
  const isEdge = /Edg/.test(navigator.userAgent);
  const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
  const isFirefox = /Firefox/.test(navigator.userAgent);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg mx-4 glass-card rounded-3xl p-8 z-50 shadow-2xl border border-white/20"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center mb-6 mx-auto">
              <Mic className="w-8 h-8 text-red-400" />
            </div>

            {/* Title */}
            <h2 className="text-2xl font-medium text-white text-center mb-3">
              Microphone Access Needed
            </h2>

            {/* Description */}
            <p className="text-white/70 text-center mb-6">
              To use voice input, VarTalaab needs permission to access your microphone. 
              Please follow the steps below to enable it.
            </p>

            {/* Browser-Specific Instructions */}
            <div className="glass-card rounded-2xl p-6 mb-6 space-y-4">
              {isChrome && (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <Chrome className="w-5 h-5 text-blue-400" />
                    <h3 className="text-white font-medium">Chrome Instructions</h3>
                  </div>
                  <ol className="space-y-3 text-sm text-white/80 list-decimal list-inside">
                    <li>Click the <strong className="text-white">lock icon (🔒)</strong> in the address bar</li>
                    <li>Find <strong className="text-white">"Microphone"</strong> in the permissions list</li>
                    <li>Change it to <strong className="text-white">"Allow"</strong></li>
                    <li>Click the <strong className="text-white">"Retry"</strong> button below</li>
                  </ol>
                </>
              )}

              {isEdge && (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <Globe className="w-5 h-5 text-blue-400" />
                    <h3 className="text-white font-medium">Edge Instructions</h3>
                  </div>
                  <ol className="space-y-3 text-sm text-white/80 list-decimal list-inside">
                    <li>Click the <strong className="text-white">lock icon (🔒)</strong> in the address bar</li>
                    <li>Select <strong className="text-white">"Permissions for this site"</strong></li>
                    <li>Find <strong className="text-white">Microphone</strong> and set to <strong className="text-white">Allow</strong></li>
                    <li>Click <strong className="text-white">"Retry"</strong> below</li>
                  </ol>
                </>
              )}

              {isSafari && (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <Globe className="w-5 h-5 text-blue-400" />
                    <h3 className="text-white font-medium">Safari Instructions</h3>
                  </div>
                  <ol className="space-y-3 text-sm text-white/80 list-decimal list-inside">
                    <li>Go to <strong className="text-white">Safari → Settings</strong></li>
                    <li>Click <strong className="text-white">Websites → Microphone</strong></li>
                    <li>Find this website and set to <strong className="text-white">"Allow"</strong></li>
                    <li>Refresh the page and try again</li>
                  </ol>
                </>
              )}

              {isFirefox && (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <Globe className="w-5 h-5 text-orange-400" />
                    <h3 className="text-white font-medium">Firefox Notice</h3>
                  </div>
                  <p className="text-sm text-white/80">
                    ⚠️ Voice input is not fully supported in Firefox. Please use <strong className="text-white">Chrome</strong>, <strong className="text-white">Edge</strong>, or <strong className="text-white">Safari</strong> for voice features.
                  </p>
                </>
              )}

              {!isChrome && !isEdge && !isSafari && !isFirefox && (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <Settings className="w-5 h-5 text-blue-400" />
                    <h3 className="text-white font-medium">General Instructions</h3>
                  </div>
                  <ol className="space-y-3 text-sm text-white/80 list-decimal list-inside">
                    <li>Click the <strong className="text-white">lock or info icon</strong> in your address bar</li>
                    <li>Look for <strong className="text-white">site permissions</strong> or <strong className="text-white">settings</strong></li>
                    <li>Find <strong className="text-white">Microphone</strong> and allow it</li>
                    <li>Refresh the page if needed</li>
                  </ol>
                </>
              )}
            </div>

            {/* Additional Tips */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
              <h4 className="text-blue-300 font-medium text-sm mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Additional Tips
              </h4>
              <ul className="space-y-1 text-xs text-white/70">
                <li>• Make sure you're using <strong className="text-white">HTTPS</strong> (secure connection)</li>
                <li>• Check that your microphone is not being used by another app</li>
                <li>• Try refreshing the page after changing permissions</li>
                <li>• On mobile, check app permissions in system settings</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={onClose}
                variant="ghost"
                className="flex-1 liquid-glass text-white hover:bg-white/10 rounded-xl h-12"
              >
                I'll Type Instead
              </Button>
              <Button
                onClick={() => {
                  onClose();
                  onRetry();
                }}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl h-12 font-medium"
              >
                Retry Microphone
              </Button>
            </div>

            {/* Help Text */}
            <p className="text-center text-xs text-white/50 mt-4">
              Voice input requires microphone permissions to work
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
