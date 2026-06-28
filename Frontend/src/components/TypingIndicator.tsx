import { motion } from "framer-motion";

interface TypingIndicatorProps {
  isTyping: boolean;
  userName?: string;
}

export function TypingIndicator({ isTyping, userName }: TypingIndicatorProps) {
  if (!isTyping) return null;

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span>{userName ? `${userName} is typing` : "Typing"}</span>
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-primary rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [1, 0.5, 1],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.1,
            }}
          />
        ))}
      </div>
    </div>
  );
}
