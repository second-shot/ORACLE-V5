// Pricing output — renders when intent=resale AND route=execute
// Fields: diagnosis, primaryRoute, secondaryRoute, priceNote,
//         floor, prep (list), timeToSale, reason
// Every field ties to a detected signal — no generic templates.

export function PricingOutput({ output }) {
  if (!output) return null;

  return (
    <div className="pricing-output">
      <div className="pricing-output__row">
        <span className="pricing-output__label">Recommended route</span>
        <span className="pricing-output__value pricing-output__value--primary">
          {output.primaryRoute}
        </span>
      </div>

      <div className="pricing-output__row">
        <span className="pricing-output__label">If no traction</span>
        <span className="pricing-output__value">{output.secondaryRoute}</span>
      </div>

      <div className="pricing-output__row">
        <span className="pricing-output__label">Set price</span>
        <span className="pricing-output__value">{output.priceNote}</span>
      </div>

      <div className="pricing-output__row">
        <span className="pricing-output__label">Floor</span>
        <span className="pricing-output__value">{output.floor}</span>
      </div>

      <div className="pricing-output__row pricing-output__row--prep">
        <span className="pricing-output__label">Preparation</span>
        <ol className="pricing-output__prep-list">
          {output.prep.map((step, i) => (
            <li key={i} className="pricing-output__prep-item">
              {step}
            </li>
          ))}
        </ol>
      </div>

      <div className="pricing-output__row">
        <span className="pricing-output__label">Time to sale</span>
        <span className="pricing-output__value">{output.timeToSale}</span>
      </div>

      <div className="pricing-output__reason">
        <span className="pricing-output__label">Reason</span>
        <p className="pricing-output__reason-text">{output.reason}</p>
      </div>
    </div>
  );
}
