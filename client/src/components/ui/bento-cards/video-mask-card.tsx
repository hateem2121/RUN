import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";


interface VideoMaskCardProps {
  title: string;
  description: string;
  mediaUrl?: string | null;
  link?: string;
}

function VideoMaskCard({ title, description, mediaUrl, link }: VideoMaskCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Use media library video or null - no external CDN dependencies
  const videoUrl = mediaUrl || null;
  const isVideo = videoUrl?.match(/\.(mp4|webm|ogg)$/i);

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlaying(!isPlaying);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  };

  // Complex SVG path for masking
  const svgPath = "M183 4C183 1.79086 184.791 0 187 0H217C219.209 0 221 1.79086 221 4V14V28V99C221 101.209 219.209 103 217 103H182C179.791 103 178 104.791 178 107V118C178 120.209 176.209 122 174 122H28C25.7909 122 24 120.209 24 118V103V94V46C24 43.7909 22.2091 42 20 42H4C1.79086 42 0 40.2091 0 38V18C0 15.7909 1.79086 14 4 14H39C41.2091 14 43 15.7909 43 18V29C43 31.2091 44.7909 33 47 33H175C177.209 33 179 31.2091 179 29V4Z";

  return (
    <motion.div
      className="relative w-full h-full rounded-2xl overflow-hidden cursor-pointer group contain-layout"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      whileHover={{ scale: 1.02 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => link && window.open(link, "_blank")}
      style={{ 
        height: "400px", // Fixed height to prevent layout shifts
        minHeight: "400px",
        maxHeight: "400px"
      }}
      role="region"
      aria-label={`Video showcase: ${title || 'Category video'}`}
    >
      {/* Background Video/Image with Complex Mask */}
      <div 
        className="absolute inset-0 contain-layout"
        style={{
          aspectRatio: '1213/667',
          backgroundColor: '#ff6347',
          maskImage: `url("data:image/svg+xml,%3Csvg width='221' height='122' viewBox='0 0 221 122' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fillRule='evenodd' clipRule='evenodd' d='${svgPath}' fill='black'/%3E%3C/svg%3E")`,
          WebkitMaskImage: `url("data:image/svg+xml,%3Csvg width='221' height='122' viewBox='0 0 221 122' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fillRule='evenodd' clipRule='evenodd' d='${svgPath}' fill='black'/%3E%3C/svg%3E")`,
          maskRepeat: 'no-repeat',
          WebkitMaskRepeat: 'no-repeat',
          maskSize: 'contain',
          WebkitMaskSize: 'contain',
          maskPosition: 'center',
          WebkitMaskPosition: 'center',
        }}
      >

        
        {videoUrl && isVideo ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
            onError={() => setHasError(true)}
          >
            <source src={videoUrl} type="video/mp4" />
          </video>
        ) : videoUrl ? (
          <img
            src={videoUrl}
            alt={title}
            className="w-full h-full object-cover"
            onError={() => setHasError(true)}
          />
        ) : (
          // Fallback to solid color background when no media provided
          <div className="w-full h-full bg-gradient-to-br from-orange-400 to-red-500" />
        )}
        
        {/* Simple error state */}
        {hasError && (
          <div className="w-full h-full bg-gradient-to-br from-orange-400 to-red-500" />
        )}
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

      {/* Content */}
      <div className="relative h-full flex flex-col justify-between p-8">
        {/* Video Controls */}
        {isVideo && (
          <motion.div 
            className="flex justify-end gap-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : -20 }}
            transition={{ duration: 0.3 }}
          >
            <button
              onClick={togglePlay}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
            >
              {isPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white" />}
            </button>
            <button
              onClick={toggleMute}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
            </button>
          </motion.div>
        )}

        {/* Title and Description */}
        <div>
          <motion.h3
            className="text-3xl md:text-4xl font-bold text-white mb-3"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            {title}
          </motion.h3>
          <motion.p
            className="text-gray-200 text-lg max-w-md"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            {description}
          </motion.p>
          {link && (
            <motion.div
              className="mt-4 inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <span className="text-sm font-medium">Explore More</span>
              <span className="text-lg">→</span>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default VideoMaskCard;