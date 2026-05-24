import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { SurfaceCard } from "../components/SurfaceCard.jsx";
import { STORAGE_KEYS } from "../lib/storageKeys.js";

const ARCHIVE_KEY = STORAGE_KEYS.archive;

function loadArchiveObjects() {
  try {
    const raw = localStorage.getItem(ARCHIVE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export default function OutputPage() {
  const { id } = useParams();
  const object = useMemo(() => {
    return loadArchiveObjects().find((o) => o.id === id) ?? null;
  }, [id]);

  if (!object) {
    return (
      <main className="output-shell">
        <div className="output-not-found">
          <p className="output-not-found__msg">Output not found.</p>
          <p className="output-not-found__sub">
            This object may not exist in the current archive, or the archive
            has been cleared.
          </p>
          <Link to="/run" className="output-back">
            ← Back to ORA-CALL
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="output-shell">
      <div className="output-header">
        <Link to="/run" className="output-back">
          ← Back
        </Link>
        <span className="output-id">{object.id}</span>
      </div>
      <div className="output-card-wrap">
        <SurfaceCard object={object} />
      </div>
    </main>
  );
}
