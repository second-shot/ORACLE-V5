import { motion } from "framer-motion";

export function SurfaceCard({ item }) {
  return (
    <section className="responses">
      <motion.article
        className="response"
        initial={{ opacity: 0, y: 14, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="response-kicker">{item.output.title}</p>
        <p><strong>Diagnosis:</strong> {item.output.diagnosis}</p>
        <p><strong>Decision:</strong> {item.output.decision}</p>
        <p><strong>Next action:</strong> {item.output.nextAction}</p>
        <p className="response-detail"><strong>Reason:</strong> {item.output.reason}</p>
      </motion.article>
    </section>
  );
}
