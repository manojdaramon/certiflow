# CertiFlow Frontend — AGENTS.md

## 1. Project context and requirements

CertiFlow is a skilling certificate issuance platform. Training centres submit candidate batches; district officers review them; large batches receive additional quality review; the state office gives final approval; certificates are issued and sent through a simulated WhatsApp provider; and the public can verify certificates without logging in.

Follow the hackathon problem statement as the source of truth. The required frontend stack is **React with Vite**. Styling will use **plain CSS**; do not introduce Tailwind, Bootstrap, Material UI, styled-components, or another styling framework unless explicitly approved.

The backend is Node.js + Express + TypeScript, PostgreSQL/Prisma, Redis, and BullMQ. The frontend must communicate with the backend through its API; it must not connect directly to PostgreSQL or Redis.

The demo must support these identities and role-specific experiences:
- Anika — training centre
- Dev and Meera — district officers
- Neha — quality team
- Farah — state office
- Public/employer — unauthenticated certificate verification

## 2. General principles

- Build a clear, functional workflow before spending time on decorative polish.
- Correctly represent server state; do not invent success states or hardcode workflow outcomes.
- The backend is authoritative for permissions, validation, approval state, certificate validity, and audit history.
- Frontend role-based rendering improves usability but is not a security boundary.
- Keep components small, focused, reusable, and easy to explain.
- Handle loading, empty, success, validation, and error states for every important screen.
- Avoid unnecessary dependencies and premature abstractions.
- Use accessible semantic HTML and responsive layouts.

## 3. Project structure

Keep application code under `client/src/`. Use a feature-oriented structure that remains lightweight:

```text
client/
├── src/
│   ├── app/
│   ├── components/
│   │   ├── common/
│   │   └── layout/
│   ├── features/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── batches/
│   │   ├── approvals/
│   │   ├── certificates/
│   │   └── verification/
│   ├── hooks/
│   ├── services/
│   ├── styles/
│   │   ├── global.css
│   │   └── variables.css
│   ├── utils/
│   ├── App.jsx
│   └── main.jsx
├── public/
├── index.html
└── package.json
```

A feature may contain its own components, API helpers, and styles. Do not create folders or abstraction files until they are needed.

## 4. React and JavaScript conventions

- Use React functional components and hooks.
- Use JavaScript/JSX unless the existing Vite project has been intentionally created with TypeScript. The problem statement mandates TypeScript for the backend, not explicitly for the frontend.
- Use arrow functions for components, handlers, and helpers.
- Use `PascalCase` for React component names.
- Use `camelCase` for variables, functions, and props.
- Use kebab-case for directories and filenames.
- Use 4-space indentation and double quotes.
- Destructure props where it improves readability.
- Keep render logic readable; extract complex sections into focused components.
- Do not mutate React state directly.
- Use stable keys when rendering lists.
- Avoid unnecessary effects. Derive values during render when possible, and use effects for synchronization with external systems.
- Do not add TypeScript solely for stylistic consistency if the frontend was created as JavaScript.

## 5. Import organization

Group imports in this order, with section comments when the file has enough imports to benefit from grouping:

```jsx
/** React imports */
import { useEffect, useState } from "react";

/** Third-party libraries */

/** Local components and helpers */

/** Styles */
import styles from "./batch-list.module.css";
```

Do not add import aliases unless they are configured in Vite and provide a clear benefit.

## 6. Styling — plain CSS

Use CSS Modules (`*.module.css`) for component/feature styles and shared plain CSS files for global resets, typography, and CSS variables. This is standard CSS; do not use a CSS-in-JS solution or utility-class framework.

- Use descriptive class names in kebab-case.
- Import a CSS Module as `styles` and reference classes through that object.
- Keep global styles limited to resets, design tokens, typography, and truly global elements.
- Define reusable CSS custom properties in `styles/variables.css` for colors, spacing, radii, shadows, and layout widths.
- Prefer mobile-friendly responsive layouts and use CSS media queries directly.
- Avoid excessive selector nesting and high-specificity selectors.
- Avoid inline styles except for genuinely dynamic values that cannot reasonably be represented by classes or CSS variables.
- Do not use `!important` as a routine layout tool.
- Ensure visible focus states, sufficient contrast, and readable error/success states.
- Do not spend time building an elaborate design system during the hackathon.

Example:

```jsx
import styles from "./batch-card.module.css";

const BatchCard = ({ batch }) => {
    return (
        <article className={styles.batchCard}>
            <h2 className={styles.batchTitle}>{batch.name}</h2>
        </article>
    );
};

export default BatchCard;
```

```css
.batchCard {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
}

.batchTitle {
    margin: 0;
    font-size: 1rem;
}
```

## 7. API communication and data handling

- Centralize the API base URL and shared request behaviour in `src/services/`.
- Read the API URL from a Vite environment variable such as `VITE_API_BASE_URL`; provide a safe local default only if appropriate.
- Do not duplicate fetch configuration across components.
- Check `response.ok`, parse errors safely, and surface useful messages.
- Use the authentication mechanism actually implemented by the backend. If cookie-based authentication is used, include `credentials: "include"` and configure the API's CORS/cookie settings accordingly.
- Never store secrets in frontend environment variables. Vite variables are exposed to the browser.
- Never trust role, batch status, approval eligibility, or certificate validity supplied by local state. Refresh or update from the API after mutations.
- Handle 401 (session expired), 403 (not permitted), 404 (not found), 409 (state conflict), validation errors, and network failures distinctly.
- Prevent duplicate submissions while a request is pending.
- Show row-level CSV validation errors returned by the backend. Do not attempt to silently discard invalid rows.
- Do not put private candidate data or certificate files into browser storage unnecessarily.

## 8. Role-aware screens and workflow behaviour

Build the screens around the actual problem statement:

### Training centre (Anika)
- Create a batch.
- Upload the centre's candidate CSV.
- Show all validation errors, including row number and reason.
- Submit a valid batch.
- Track status and review history.
- Correct and resubmit a returned batch.

### District officers (Dev and Meera)
- Show batches awaiting their district review.
- Show candidate/batch details and previous decisions.
- Allow approve, reject, or return with a reason where required.
- Make it clear that two distinct officers must approve the same submission version.
- Do not show an enabled action when the backend says the user is not eligible.

### Quality team (Neha)
- Show batches requiring additional quality review.
- Show relevant batch and candidate details.
- Submit the quality review decision supported by the backend.

### State office (Farah)
- Show batches awaiting final decision and delayed/stuck batches.
- Approve eligible batches.
- View audit history.
- Cancel an issued certificate with a reason.

### Public verification
- Must be accessible without login.
- Allow lookup using the supported certificate identifier or verification link/token.
- Clearly distinguish valid, cancelled, and not-found/invalid certificates.
- Display only the limited candidate/certificate information returned by the public API.
- Do not expose private phone numbers or other unnecessary personal details.

Do not assume or hardcode a batch-size threshold for quality review. Display the review stage returned by the backend.

## 9. Real-time updates

The problem statement requires users to see changes without refreshing. Use the real-time mechanism exposed by the backend (for example, authenticated Server-Sent Events or WebSockets) if it is implemented.

- Authenticate real-time connections using the supported backend mechanism.
- Subscribe only to updates the current user is authorized to see.
- Treat real-time messages as notifications to refresh/reconcile server data, not as permission to change authoritative state locally.
- Handle disconnects and reconnects gracefully.
- Provide a manual refresh fallback.
- Do not add a real-time library or infrastructure before confirming the backend implementation.

## 10. Accessibility and responsive behaviour

- Use semantic elements (`button`, `form`, `label`, `table`, headings, etc.).
- Every form control must have an associated label.
- Buttons must have clear accessible names and correct disabled/loading states.
- Do not communicate status through color alone; include text or icons with accessible labels.
- Provide keyboard-visible focus indicators and sensible tab order.
- Make tables usable on narrow screens (responsive overflow or an appropriate card layout).
- Ensure dialogs and menus can be operated with a keyboard if implemented.

## 11. Error, loading, and empty states

Every data-driven screen should account for:
- Initial loading and background refresh.
- Empty results with a useful explanation.
- API/network errors with a retry action where appropriate.
- Validation errors close to the relevant field or row.
- Permission errors without exposing restricted data.
- Pending mutations with disabled controls and clear feedback.
- Success feedback only after the backend confirms success.

Do not use alerts as the default application UI. Keep feedback consistent and lightweight.

## 12. Testing

- Add tests for important UI behaviour using the test tools already configured in the project; do not install a large test stack without need.
- At minimum, verify role-aware navigation/actions, CSV validation error display, approval/return flows, loading/error states, and public verification status rendering.
- Mock API responses in frontend tests; do not depend on a live WhatsApp provider or external service.
- Do not treat frontend tests as a substitute for backend authorization and integrity tests.

## 13. Performance and maintainability

- Avoid unnecessary re-renders and expensive computations, but do not add memoization without a reason.
- Paginate or limit large lists using backend API support.
- Do not fetch the same data repeatedly from multiple components when a shared feature-level hook or state is sufficient.
- Keep dependencies minimal.
- Do not add charting, animation, icon, or component libraries unless they materially improve a required flow.
- Use meaningful names and avoid deeply nested conditional JSX.

## 14. Collaboration and AI-assisted development

- Inspect existing files before editing them.
- Make focused changes; do not rewrite unrelated components or configuration.
- Explain assumptions when the problem statement is silent. Keep business thresholds and workflow rules sourced from backend responses/configuration rather than duplicating them in the UI.
- Do not invent backend endpoints or response fields. Confirm the API contract before integrating.
- Do not claim a feature works unless it has been run and checked.
- Keep known limitations visible in project documentation.
- Code generated with AI must be reviewed, understood, and tested before submission.

## 15. Definition of done

A frontend feature is complete when:
- It matches the relevant user role and workflow.
- It uses the backend API rather than fabricated local data for real application state.
- Loading, empty, success, validation, and error states are handled.
- It does not expose actions or data outside the user's permitted scope.
- It is responsive and keyboard-usable.
- Relevant tests pass and the feature works in the Docker Compose local setup.
