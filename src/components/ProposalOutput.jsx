// Proposal output — renders when intent=build or creative AND route=execute
// Fields: audience, format, deliverable, nextAction, reason
// Every field ties to a detected signal — no generic templates.

export function ProposalOutput({ output }) {
  if (!output) return null;

  return (
    <div className="proposal-output">
      <div className="proposal-output__row">
        <span className="proposal-output__label">Audience</span>
        <span className="proposal-output__value proposal-output__value--primary">
          {output.audience}
        </span>
      </div>

      <div className="proposal-output__row">
        <span className="proposal-output__label">Format</span>
        <span className="proposal-output__value">{output.format}</span>
      </div>

      <div className="proposal-output__row">
        <span className="proposal-output__label">Deliverable</span>
        <span className="proposal-output__value">{output.deliverable}</span>
      </div>

      <div className="proposal-output__row">
        <span className="proposal-output__label">Next action</span>
        <span className="proposal-output__value">{output.nextAction}</span>
      </div>

      <div className="proposal-output__reason">
        <span className="proposal-output__label">Reason</span>
        <p className="proposal-output__reason-text">{output.reason}</p>
      </div>
    </div>
  );
}
