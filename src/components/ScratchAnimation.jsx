// src/components/ScratchAnimation.jsx
import { Player } from '@lottiefiles/react-lottie-player';
import scratchJson from '../assets/scratch.json';

export default function ScratchAnimation({ visible }) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <Player
        autoplay
        keepLastFrame
        src={scratchJson}
        style={{ height: 300, width: 300 }}
      />
    </div>
  );
}
