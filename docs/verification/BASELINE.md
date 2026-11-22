# Local foundation evidence · November 22, 2026

| Check | Observed result |
| --- | --- |
| Official generator, isolated Node and pnpm | create-medusa-app 2.23.0, Node 22.23.4, pnpm 10.11.1. Generated the backend and storefront in staging. Frozen workspace installation succeeded. |
| Services | docker compose config --quiet and up -d --wait succeeded. Both health checks passed. Dedicated loopback ports 15432 and 16379. |
| Database | Native migrations and project seed completed. Repeating db:migrate retained the two SKU records. SQL inspection showed 12 direct units and zero supplier units. |
| Static checks | pnpm lint and pnpm typecheck exercised both app packages. |
| Production bundles | pnpm build builds backend, native Admin and Next.js in sequence. |
| Live integration | pnpm test checks the two API prices, PHP region, unauthorized merchant access, Studio link and server-rendered catalog contents. |
| Admin | An invitation for a reserved example identity was accepted. Native email/password login and authenticated /admin/users/me succeeded. |
| Browser | playwright-cli 0.1.24 tested keyboard round trips and reflow at 390, 768 and 1440 px with reduced motion. Screens in screens/. |
| Design | Ink/Ivory 13.897:1. Original Teal/Ivory 4.481:1 fails for normal text. Action teal #087B70 on Ivory 4.718:1. System fonts and original favicon. |

During verification the physical project path affected migration discovery. The local runtime now uses a simple physical path. The production Admin initially could authenticate an HTTP request but could not retain the browser session over local HTTP. Its loopback-only launch mode now explicitly configures the session cookie. The first generated icon used RGB rather than RGBA and failed Next image compilation. The revised icon uses RGBA.

The frozen install reports skipped optional package build scripts under the upstream pnpm policy. Installed binary packages supported the local builds. M1/M2 remain responsible for complete shopping and supplier journeys, interaction-specific accessibility, error handling and durable job tests.

After the cookie and icon corrections, both production builds, lint and strict typechecks exited 0. The Playwright merchant session submitted the sign-in form, reached native Products and located Desk tray. The final three-width storefront run passed. The adaptive scaffold runner returned PASS for the requested pnpm test command (exit 0). No purchase or fulfillment test is attributed to M0.
