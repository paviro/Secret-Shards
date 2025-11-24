import { motion } from 'framer-motion';

export default function DismissTimer({ duration }: { duration: number }) {
    return (
        <motion.div
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{
                duration: duration / 1000,
                ease: "linear",
                delay: 0.2 // Wait for parent enter animation
            }}
            className="absolute bottom-0 left-0 h-1 bg-current opacity-30"
        />
    );
}

