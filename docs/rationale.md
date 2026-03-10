import useBaseUrl from '@docusaurus/useBaseUrl';

# Rationale: Redesigning the Azion Functions Documentation

:::info A Note on Authenticity and AI Assistance
To ensure complete transparency regarding my thought process and strategic decisions, I am providing the <a target="_blank" href={useBaseUrl('/rationale-draft.pdf')}><strong>original, unedited draft of this rationale (PDF)</strong></a>. 

I am also providing an <a target="_blank" href={useBaseUrl('/interaction-example.pdf')}><strong>export of the AI interaction log (PDF)</strong></a> to demonstrate how we actively pair-programmed and refined the documentation together.

While I leverage AI extensively in my workflow as an accelerator - to format texts, generate code boilerplates, and create diagrams - the core architecture, structural decisions, and the original draft of this rationale are entirely my own. The AI helped organize this final document, but the human remains the driver.
:::

Welcome to the rationale behind the proposed documentation for **Azion Functions**. This page details my decision-making process for redesigning the onboarding flow, the architectural improvements to the documentation's UX/UI, the technical trade-offs of the chosen code examples, and a vision for the future of Azion's developer experience.

:::tip On "Developer Experience" vs. "Documentation"
While this challenge focuses on redesigning the **Documentation** and improving the onboarding flow, true Developer Experience (DevEx) encompasses much more - from SDK ergonomics to Console UI/UX and CLI execution times. My approach here is to push the boundaries of what docs can do, with the understanding that a holistic DevEx transformation requires continuous, tight collaboration with the Engineering and Product teams to align the platform's capabilities with developer expectations.
:::

---

## 1. Information Architecture & The New Narrative

The current documentation attempts to map to Azion's organizational model used in its console (Build, Secure, Store, Deploy, Observe). However, this organization is not ideal for learning, especially for beginners. The redesign shifts the focus to make the **Function** the primary entity from which everything else flows.

### The "Function is the Star" Approach
The developer's journey should start with what makes the magic happen: writing code. The new structure introduces concepts progressively based on this foundation:
1. **Overview:** What are Edge Functions and what do they do?
2. **Getting Started:** Quick wins. Learn the prerequisites, write the function, configure the application, and test it in minutes. (Short tutorial videos are also included to ease the funnel from account registration to the first deploy, catering to visual learners).
3. **Development:** The core reference. Detailed guides on function structure, arguments, environment variables, routing, and requests.
4. **Platform Integration:** Tying it all together by introducing instances, rules, applications, and workloads *in that order*, demonstrating how they build on and reuse the function.

### Consolidating "Limits" and "API Reference"
Currently, platform limits appear redundantly across multiple pages, often obscuring navigation. Since they are crucial, they should ideally live right inside the console UI - together with the current consumption of those limits! For documentation, they belong in a single, dedicated root page. Similarly, the **API Reference** is vital but should not interrupt the core learning path; it has been relocated to its own primary menu section to prevent confusion ("Why are there two docs?").

### Advanced Topics & Observability
Topics like Sentry/Grafana integrations, WebAssembly, or AI Inference are intentionally isolated into "Advanced Topics" and "Observability" sections. They are deep-dives for users who already grasp the basics, keeping the initial learning curve gentle.

---

## 2. Documentation UX & Usability Improvements

A significant portion of my effort went into refining the reading experience. The current documentation suffers from abrupt context switches and hidden navigation. I implemented several UI/UX enhancements:

### Intelligent Navigation & Sidebar Context
- **Fixed Internal Links:** In the current docs, internal links often open new windows, which I find disruptive. My redesign ensures that all internal links stay in the same tab, preserving browsing history. Only external links open in new windows.
- **Contextual Sidebar:** The sidebar is now the user's ultimate anchor. It utilizes a subtle orange tint (from Azion's palette) for all "sibling" pages and high-contrast markers for parent hierarchies, instantly answering "Where am I?"
- **Prominent Pagination:** "Previous" and "Next" buttons have been moved from the very bottom of the page (where they were hidden below "Limits") to the top, directly under the breadcrumbs. Users immediately know they can navigate sequentially before even beginning to read.

### Breadcrumbs & Responsive Behavior
Deep documentation structures or long titles often break breadcrumbs on mobile devices. 
- I implemented text-truncation (ellipsis `...`) for the active page node and intermediate nodes to guarantee everything fits on a single line. 
- If the user clicks/taps an elided node, the breadcrumbs expand into a multi-line, wrapped layout displaying the full hierarchy.

### Keyboard Shortcuts
For power users on desktop:
- **`CMD/CTRL` + `Left/Right Arrow`:** Instantly navigates to the previous or next page. This is visually communicated by keyboard icons placed directly next to page titles.
- **`CMD/CTRL` + `K`:** Opens the global search, mimicking industry-standard behaviors.

### Glossaries and Diagrams
- **Automated Glossary:** Acronyms are a barrier to entry. I generated a glossary page that explains terms and provides internal/external references.
- **Visual Architecture:** I added AI-generated diagrams for "Functions in Platform Architecture" and the "Complete Example Project" to cater to visual learners.

---

## 3. The Reference Project: Augmented Open5e

To validate the documentation, I built **[Augmented Open5e](https://github.com/luigivieira/augmentedopen5e)** - an open-source project that uses Edge Functions to translate D&D rules via LLMs. The idea was to experiment with a more complex use case of the platform's available features. It uses KV Storage, `waitUntil` (for asynchronous background processing), and the only reason it doesn't use Azion's AI Inference is because I encountered issues during testing. This serves as a good reminder to improve the developer experience there: error messages should explicitly state the technical reason a model failed, rather than vaguely suggesting it doesn't exist or isn't allowed. I also manually iterated on the UI of this project based on peer feedback (e.g., tweaking the progress indicator messages for the background `waitUntil` task so they better manage user expectations and don't visually resemble error messages - especially since the API correctly returns a `202 Accepted` to indicate work in progress).

### Trade-offs: Monolith Edge API vs. Micro-functions
For the project architecture, I chose a **Monolith Edge API** where a single function handles all endpoints based on Azion's routing rules and the request path.
* **Pros:** A single deploy, perfect code reusability (auth, JSON validation), and reduced general "cold starts" (a hit on `/api/monsters` warms the V8 Isolate for a subsequent hit on `/api/spells`).
* **Cons:** Slightly larger final bundle size.
* **Why not Micro-functions?** Building a separate function for every endpoint creates immense management overhead (dozens of separate console instances and rules) and forces library duplication. 

*(Note: If Azion introduces non-HTTP triggers in the future, like cron jobs, the ideal architecture would separate those from the HTTP Monolith).*

### CLI Deployment vs. Console Onboarding
While the actual project utilizes the Azion CLI, the documentation's "Getting Started" intentionally guides users through the Console. For absolute beginners, visual interfaces provide a more intuitive and reassuring onboarding experience. However, the "Local Development / Preview" page focuses directly on how to do this via the CLI, and adding a full CLI-focused onboarding tutorial there would be a great next step.

---

## 4. The Development Process & AI Usage

As noted above, AI was a powerful collaborator. 
- I architected the code, but the AI generated ~90% of it under my strict review, manual testing, and iterative refinement. 
- The AI helped format this documentation, but the strategic decisions (the "Function First" narrative, discarding the old structure, implementing keyboard shortcuts) were entirely mine. 
- While I used AI to generate the diagrams, **all tutorial videos were created entirely manually** using OBS Studio with plugins on Mac for effects, and edited in Wondershare Filmora. 

---

## 5. Future Vision (The "If I Had More Time" List)

If this were a full-scale, long-term project, here are the initiatives I would prioritize to elevate the Azion Developer Experience:

* **In-Page Feedback & Corrections:** A mechanism where users can highlight text and click "Submit Correction," automatically generating a ticket with the exact page, locale, and problematic paragraph.
* **Community Comments:** Adding page-level comment sections (like traditional PHP docs) for immediate peer-to-peer developer support.
* **Smart UI Scrolling:** Auto-scrolling the sidebar into view when a user jumps to a deeply nested page via search or direct links.
* **Advanced Search Filters:** Implementing the granular search filters that currently exist and work very well in the original Azion documentation.
* **Focus on Reusability Examples:** Dedicated guides on how to properly share/reuse functions and instances across applications.
* **Public Rewards & Showcases:** A dedicated showcase for notable community projects, paired with badges/credits to gamify contributions.
* **Strict a11y Audits & Color Contrast:** Guaranteeing proper ARIA labels and perfect legibility for developers with reduced sight or color blindness.
* **Maintainable Visuals:** Regenerating diagrams to separate the visual elements from the text layer, removing the reliance on AI regeneration for simple typo fixes or localizations.
* **More Locales:** Expanding language support to democratize access.
