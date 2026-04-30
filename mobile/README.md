# Oracle V1 — React Native

Single-screen mobile shell. Canonical baseline only.

---

## What this is

`OracleV1Screen.tsx` is a faithful React Native translation of the Oracle V1 rhythm.

Three explicit states. One surface. No routing. No backend.

```
Presence → Surface → Lock → reset
```

---

## States

| State | What happens |
|---|---|
| **Presence** | Dark field. Orb breathes slowly. Tap the orb to continue. |
| **Surface** | Orb tightens. Three options materialise with stagger. Tap one to choose. |
| **Lock** | Orb compresses → expands → calms. Chosen option stays lit. Others fade. Resets automatically. |

---

## Usage

This component uses only core React Native primitives and `Animated`. No additional packages are required.

**Bare React Native:**

```tsx
import OracleV1Screen from "./mobile/OracleV1Screen";

export default function App() {
  return <OracleV1Screen />;
}
```

**Expo:**

```tsx
import { StatusBar } from "expo-status-bar";
import OracleV1Screen from "./mobile/OracleV1Screen";

export default function App() {
  return (
    <>
      <StatusBar style="light" />
      <OracleV1Screen />
    </>
  );
}
```

---

## Constraints

- This file is a **locked baseline reference**.
- Do not add routing, backend logic, memory, or additional screens inside this component.
- Visual drift across platforms is expected and accepted. Identity is preserved through timing, scale behaviour, contrast, and structural restraint — not decorative effects.
- The next valid step is defining how future versions branch from this baseline, not modifying it.
