import { AnimatePresence, motion } from "framer-motion";
import { SurfaceCard } from "./SurfaceCard.jsx";

export function MemoryStack({ objects }) {
  if (objects.length === 0) return null;

  return (
    <ol className="memory-stack" aria-label="Oracle outputs">
      <AnimatePresence>
        {objects.map((obj) => (
          <motion.li
            key={obj.id}
            className="memory-stack__entry"
            initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <SurfaceCard object={obj} />
            {obj.memoryMatch?.label ? (
              <p className="memory-stack__related" aria-label="Related memory match">
                ↳ {obj.memoryMatch.label}
              </p>
            ) : null}
          </motion.li>
        ))}
      </AnimatePresence>
    </ol>
  );
}
