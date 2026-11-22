# Full Proposed Landing Page: Merqloom Studio

**Status:** Proposed original copy for a demonstration, not evidence of implemented features. Verify all claims and CTAs before publication. Apply `commerce-conversion-strategy`, `design-taste-frontend`, and `design-motion-principles` during implementation.

## 11. Merqloom Studio landing-page copy: complete draft

**Status:** Proposed copy. Before publication, match every feature claim to actual implementation state in `docs/conversion/CLAIMS_REGISTER.md`. For the MVP this is a **developer demonstration**, not a live commercial SaaS.

### Global navigation

Logo: **MERQLOOM**  
Tagline: *Commerce, connected.*  
Navigation: Platform | Storefront | Operations | How It Works | Roadmap | FAQs  
Primary navigation CTA: **Request a Preview** (only after the request flow works; until then, **Explore the Roadmap**).

**Site-wide development notice:** Merqloom is an independent commerce platform in development. Current demonstrations use sample products, simulated payments and fictional suppliers.

### Section 01: Hero

**Eyebrow:** COMMERCE, CONNECTED.

# A better shopping experience. A clearer way to run commerce.

Running an online store involves more than selling products.

Merqloom is being built to connect product discovery, inventory, orders, suppliers, and fulfillment through one adaptable commerce platform.

Whether products ship from your own inventory or an external supplier, the goal is simple: make shopping clearer for customers and daily operations easier to manage.

**Primary CTA:** Explore the Platform  
**Secondary CTA:** Request an Early Walkthrough (when functional)  
**Supporting copy:** Designed for growing online businesses, independent merchants, and teams managing multiple fulfillment methods.

**Hero visual:** Original, accessible showcase showing the sample Store interface alongside a merchant operations screen, linked by one fictional order. No implied live sales figures.

### Section 02: The problem

## Your customer sees the storefront. Your business handles everything behind it.

A customer finds a product, checks the details, and places an order.

Behind that simple experience, someone still needs to answer important questions:

- Is the product available?
- Where will the order be fulfilled?
- Does a supplier need to process it?
- Has fulfillment started?
- What happens when stock information changes?

Disconnected tools and unclear processes can make these questions harder to answer.

**Merqloom is designed to bring those workflows into one coordinated experience.** Not by replacing every system a business uses, but by establishing clearer connections between the storefront and the work behind each order.

### Section 03: Storefront

## Make discovering the right product feel effortless.

Customers need more than attractive product photography. They need enough information to decide whether a product fits their needs.

Merqloom Store is designed around clear, useful shopping experiences.

**Products worth exploring:** Present products through organized collections, relevant imagery, understandable descriptions, and meaningful specifications.

**Details that answer real questions:** Help customers understand variations, dimensions, materials, compatibility where relevant, and the information that influences purchasing decisions.

**A cart without unnecessary confusion:** Show selected items, quantities, pricing, and available fulfillment information before customers proceed.

**Designed for every screen:** Create a consistent shopping experience across phones, tablets, and desktop browsers.

CTA: **Explore the Storefront**

*Development note: Illustrative product imagery and simulated shopping flows are used in the initial demonstration.*

### Section 04: Merchant operations

## What happens after checkout matters just as much.

A well-designed storefront is only one part of a successful commerce workflow.

Merqloom Console is being developed to help merchants understand what is happening behind their orders.

**Product management:** Organize products, variants, collections, and inventory information using established commerce functionality.

**Order visibility:** Review customer orders and identify their current processing and fulfillment status.

**Supplier coordination:** Connect products to supplier records and inspect the status of supported supplier operations.

**Inventory awareness:** View available stock information and identify synchronization issues requiring attention.

**Operational exceptions:** Make failed imports, unavailable inventory, and fulfillment problems visible rather than hiding them inside background processes.

CTA: **See the Operations Workflow**

*Initial release: Core commerce administration with focused supplier operations extensions. Advanced reporting and real supplier integrations are later roadmap items.*

### Section 05: Two fulfillment models

## Different fulfillment models. A consistent customer journey.

Not every online business manages inventory the same way. Merqloom is designed to accommodate more than one approach.

**Direct inventory**

1. Publish products from available inventory.
2. Let customers browse and place orders.
3. Review orders through the merchant console.
4. Process fulfillment from the assigned stock location.
5. Track the resulting order status.

**Supplier fulfillment**

1. Connect products with a supplier record.
2. Synchronize available supplier information.
3. Receive an order through the storefront.
4. Route fulfillment through the configured supplier workflow.
5. Review acknowledgments and fulfillment updates.

**One platform. Different paths from order to fulfillment.**

*The MVP supplier is fictional and its fulfillment is simulated. Live supplier access requires approval and separate integration.*

### Section 06: Automation

## Less repetitive coordination. More visibility into what matters.

Some commerce operations should not depend on manually checking every product or order. Merqloom's planned automation is intended to support routine tasks.

**Inventory synchronization:** Process scheduled stock updates from supported supplier data sources.

**Order workflow coordination:** Trigger appropriate processing steps when supported order events occur.

**Error handling and retries:** Record unsuccessful operations and provide controlled investigation and retry paths.

**Fulfillment updates:** Keep relevant order and supplier status information connected as new data becomes available.

**The goal is not automation for its own sake. It is making routine operations easier to manage and exceptions easier to identify.**

### Section 07: How it works

## From product setup to order visibility.

**1. Prepare the catalog.** Create or import products, organize collections, and establish inventory information.

**2. Publish the storefront.** Present products through a responsive shopping experience designed around clear information and straightforward navigation.

**3. Receive an order.** Customers complete the supported checkout flow; the commerce backend records the transaction.

**4. Process fulfillment.** The order follows the configured direct-inventory or supplier-fulfillment workflow.

**5. Review and manage.** Merchants inspect progress, identify exceptions, and complete supported administrative actions.

CTA: **View the Demonstration Journey**

*The MVP demonstration uses test transactions only. No real payments or shipments are processed.*

### Section 08: Purchasing clarity and trust

## Good commerce design helps people buy with confidence, not pressure.

Merqloom prioritizes information customers can understand and decisions they can make without unnecessary friction.

**Clear product value:** Explain what a product does, who it is appropriate for, and which specifications matter.

**Transparent purchasing information:** Make prices, delivery information when available, material limitations, and relevant terms easy to find.

**Consistent navigation:** Help customers move naturally from product discovery to evaluation, cart, and checkout.

**Accessible interaction:** Build for readable content, keyboard navigation, clear labels, and understandable feedback.

**Thoughtful measurement:** Use appropriately configured analytics to investigate where customers encounter difficulty and test changes against observed results.

**The best purchasing experience helps people make informed decisions.**

### Section 09: Flexible architecture

## Start with the essentials. Extend when the business needs more.

Merqloom is being developed with a modular commerce foundation. The initial architecture uses Next.js for the storefront and Medusa for commerce operations.

This approach allows the project to extend existing commerce functionality instead of rebuilding common systems from scratch.

Potential future extensions include additional suppliers, advanced fulfillment, operational reporting, customer engagement, storefront customization, and authorized shipping/payment services.

**Built for an evolving business, with each capability introduced when there is a reason to add it.**

### Section 10: Development roadmap

## Building something useful, one working workflow at a time.

**Stage 1: Foundation:** Application scaffolding, commerce infrastructure, storefront foundations, initial design system.

**Stage 2: Shopping experience:** Product browsing, product details, cart, simulated checkout.

**Stage 3: Connected operations:** Direct inventory, fictional supplier integration, inventory synchronization, merchant visibility.

**Stage 4: Demonstration release:** End-to-end testing, accessibility review, technical verification, documented walkthrough.

**Target MVP demonstration: December 7, 2026.** Future production features depend on operating requirements and verified integrations.

CTA: **Follow the Development Roadmap**

### Section 11: Frequently asked questions

**Is Merqloom available for production use?**  
Not yet. Merqloom is in development. The initial release is intended to demonstrate working commerce operations using fictional products, sample data, and simulated transactions.

**Does Merqloom support dropshipping?**  
Dropshipping support is part of the planned MVP architecture. Its first demonstration will use a mock supplier. Actual supplier integrations depend on provider capabilities, specifications, and authorization.

**Can Merqloom manage a business's own inventory?**  
Direct inventory management is part of the planned demonstration, using the underlying commerce platform's inventory and stock-location capabilities.

**Does Merqloom process real payments?**  
Not in the initial demonstration. All MVP checkout transactions are simulated. Production payments require an approved provider and separate production validation.

**Will Merqloom work with different product categories?**  
The platform is intended to support varied physical products through configurable catalogs, variants, and fulfillment. Particular industries may introduce additional requirements.

**Is Merqloom a replacement for Shopify or WooCommerce?**  
Merqloom is an independently developed commerce project. It is not yet positioned as a complete replacement for mature commercial platforms.

**How much will Merqloom cost?**  
Commercial pricing has not been established. The initial work focuses on validating core functionality.

**Can I request a demonstration?**  
An early walkthrough will be offered when a working demonstration is available. Preview availability will be communicated through a working official contact channel once established.

### Section 12: Final CTA

# Commerce should feel connected, from the first product view to the final order update.

The storefront is where customers begin. Behind it is everything that keeps the business moving. Merqloom is being built to bring those experiences closer together.

Primary CTA: **Request an Early Walkthrough** (only if operational)  
Secondary CTA: **Explore the Roadmap**

Supporting text: An independent commerce platform in development. Demonstration access and production availability are separate.

### Footer

**MERQLOOM**  
*Commerce, connected.*  
Platform | Storefront | Operations | Development Roadmap | Contact  
Privacy | Terms (publish only complete and valid content, not fabricated legal terms)

Merqloom is an independent software development project. Demonstration products, suppliers, orders, payments, and shipments are fictional unless explicitly stated otherwise.

Copyright line: Use only when applicable to the owned materials and verified brand ownership.

### 11.1 SEO metadata and page routes

**Title:** `Merqloom | Storefront & Commerce Operations Platform`  
**Description:** `Discover Merqloom, a commerce platform in development connecting storefronts, inventory, suppliers, and order workflows. Explore the upcoming demo.`

Suggested marketing routes: `/`, `/platform`, `/storefront`, `/operations`, `/roadmap`, `/contact` (only create routes with meaningful content; avoid multiplying empty pages). Keep demonstration storefront paths distinct from the marketing pages so buyers know which experience they are browsing.

### 11.2 CTA acceptance rules

- `Explore the Platform` scrolls/navigates to the actual platform explanation.
- `Explore the Storefront` opens a working demo storefront route with visible demo labeling.
- `View the Demonstration Journey` opens verified example flows or a truthful recorded demonstration.
- `Follow the Development Roadmap` opens a real roadmap page.
- `Request an Early Walkthrough` must not be displayed as an active form/button until there is a working, privacy-aware request channel; before that use `Explore the Roadmap` or a real authorized contact destination.
- No misleading availability, free-trial, testimonial, pricing or performance language.

---
