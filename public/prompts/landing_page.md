Update the existing landing/login page in this Angular 17 application for a Smart Banking Network Intelligence System.

First inspect the current landing page component, its styles, and existing assets. Adapt the current implementation instead of creating a separate app or replacing unrelated functionality. Keep the existing authentication behavior and routing intact.

## Design direction
Create a polished, responsive banking GIS landing page inspired by the provided mockup:
- Deep emerald and teal palette with white text and subtle green accents
- A slim vertical icon navigation rail on the left
- A full-page Riyadh map backdrop with branch and ATM markers, softly dimmed behind the content
- A green header with a generic banking icon and the title “Riyad Bank Smart Banking System”
- A translucent dark-green login card on the left
- A welcome and feature section on the right

Use the project’s existing map component and map assets if available. Do not invent live map data or change the map integration. If no usable map background exists, use the app’s current map view or a suitable local placeholder.

## Exact page copy
Login card:
- “SMART BANKING NETWORK SYSTEM”
- “Branch, ATM & Service Intelligence”
- Username field
- Password field with show/hide control
- Remember me
- Sign in
- Active Directory SSO

Welcome section:
- “Welcome to Smart Banking”
- “Explore banking locations and network coverage across Riyadh.”
- “Branch & ATM Locator”
- “Service and Accessibility Filters”
- “Network Coverage Analytics”
- “District-Level Demand Planning”
- “Map-Based Reporting”

## Requirements
- Preserve existing sign-in, password visibility, remember-me, forgot-password, and SSO behavior where implemented.
- Use Angular 17 conventions and the project’s existing component structure and styling approach.
- Make the layout responsive for desktop, tablet, and mobile. On small screens, stack the login and welcome sections and keep the login form easy to use.
- Use semantic HTML, accessible labels, keyboard focus states, and sufficient color contrast.
- Reuse existing icon packages and dependencies; do not add packages unless necessary.
- Keep the screen’s text editable in the Angular template rather than baking it into an image.
- If any displayed ATM or branch points come from synthetic demo data, label them clearly as demo data in the UI. Do not present them as verified Riyad Bank locations.
- Do not change backend APIs, authentication logic, routing, or unrelated pages.

After implementation, summarize the files changed and any assumptions or missing assets.