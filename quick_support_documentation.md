# QUICK-SUPPORT WIDGET: IMPLEMENTATION APPROACH & CUSTOMISATION GUIDE

This document serves as the official project submission documentation for the Shopify Quick-Support Widget. It is divided into two sections: **Part A** covers the technical architecture, optimization techniques, and development choices, while **Part B** is a merchant-facing customization guide.

---

## PART A: TECHNICAL APPROACH & RATIONALE

### 1. Data Architecture & Block Strategy
To satisfy the requirement that all questions and categories must be editable and reorderable in the Theme Editor, we structured the solution using Shopify Section Blocks:
* **Category Blocks:** Define a topic group (e.g., Shipping, Returns) and associate it with a visual icon.
* **Question Blocks:** Contain the question, category title (reference), rich-text answer, and a "Featured" toggle.

**The Linking Strategy & Trade-offs:**
Shopify’s Liquid schema does not support dynamic block-reference dropdowns (i.e., you cannot select a block ID from a dropdown in another block). To solve this, we link questions to categories by matching their **Category Name (string)**:
* *Alternative considered:* Hardcoding IDs. *Result:* Poor usability; merchants would have to copy and paste system IDs.
* *Chosen approach:* Text string matching. *Trade-off:* The merchant must spell the category title exactly the same in both the Category block and the Question block. We resolved this trade-off by adding clear warning labels in the Theme Editor sidebar (`"Must match a category name exactly — spelling and capitalisation matter"`).

---

### 2. Micro-Animations & Easing
For a premium, native-app feel, we avoided generic transition timings and implemented a cohesive animation system:
* **Custom Easing:** All transitions use a sleek, responsive cubic bezier: `cubic-bezier(0.22, 1, 0.36, 1)`.
* **Staggered View Entrances:** When moving between the homepage, category overview, and answers, elements (headers, content, page links) slide up sequentially using staggered CSS `animation-delay` increments (`40ms`, `80ms`, `120ms`, `160ms`).
* **Directional Sliding:** JavaScript sets a `data-qs-dir` attribute on the panel container (`forward` or `back`) to dictate slide-left or slide-right directions, ensuring the back-button navigation visually matches the user's mental model.
* **Reduced Motion Support:** We respected the browser's accessibility settings by wrapping transition overrides in a `@media (prefers-reduced-motion: reduce)` block, instantly disabling all sliding and scaling effects.

---

### 3. Accessibility (a11y)
The widget is fully keyboard-navigable and compatible with screen readers:
* **ARIA Roles:** The widget uses `role="dialog"`, `aria-modal="true"`, and appropriate `aria-expanded` and `aria-haspopup` attributes on launcher controls.
* **Focus Trap:** When the panel is active, focus is trapped inside the panel. Pressing `Tab` or `Shift + Tab` cycles only through visible, active buttons (launcher, contact links, questions, back, pager, close button).
* **Keyboard Escape:** Pressing the `Escape` key instantly closes the widget and returns focus to the launcher button.
* **Semantic HTML:** Appropriate `<h2-h3>` elements, buttons with `type="button"`, and `<nav>` landmarks ensure standard screen reader compatibility.

---

### 4. Performance & Code Quality
We achieved maximum performance by adhering to the "no framework" mandate:
* **Zero External Dependencies:** Built entirely with vanilla JavaScript and CSS.
* **Non-blocking CSS/JS:** 
  * The stylesheet is loaded asynchronously via the `media="print" onload="this.media='all'"` trick to prevent render blocking, with a `<noscript>` fallback.
  * The JavaScript is loaded with a `defer` attribute.
* **Inert HTML Template:** To avoid embedding massive, hidden DOM hierarchies for FAQs, question content is loaded inside an HTML `<template>` tag as small JSON blocks. JavaScript reads and parses this data lazily upon page load, maintaining a lightweight DOM footprint.

---

### 5. Future Enhancements & Production Steps
If deploying this to a production storefront, we recommend:
1. **Analytics Integration:** Logging the "Was this helpful?" clicks (👍 / 👎) to an endpoint (e.g. Shopify App Proxy, Google Analytics 4 event, or a custom database) to track which FAQs perform best.
2. **Icons Lazy-loading:** Dynamically loading SVGs to further decrease the initial page weight.

---

## PART B: CLIENT-FACING CUSTOMISATION GUIDE

### 1. Adding the Widget & Storefront Sections
1. Go to your **Shopify Admin** → **Online Store** → **Themes**.
2. Click **Customize** next to the active theme to open the Theme Editor.
3. **Floating Support Widget:** Locate the **App Embeds** sidebar (or add the **Quick Support** section directly to the Footer template). 
4. **Standalone Featured Section:** Scroll to the bottom of the page, click **Add Section**, and select **Featured Questions** from the list.

---

### 2. Customising Themes & Colours
In the section settings sidebar, merchants can adjust:
* **Launcher Button:** Change the background color, icon color, size (48px - 80px), custom launcher icon image, and bottom/left margins (offsets).
* **Panel Design:** Edit the panel background, primary body text color, muted text color, accent color (used for icons/borders), and corner radius (0px - 24px).
* **Typography:** Toggle the **"Use custom font override"** setting and use the font picker to select any custom font. Unchecking it will automatically inherit the storefront's body font.

---

### 3. Setting Up Categories & Questions
The content is completely managed by adding blocks:
1. **Adding a Category:**
   * Click **Add block** inside the Quick Support section and choose **Category**.
   * Enter the **Category name** (e.g., *Shipping & Delivery*).
   * Choose a pre-configured icon from the dropdown menu (e.g. *Truck, Box, Returns, Shield*).
2. **Adding a Question:**
   * Click **Add block** and choose **FAQ Question**.
   * Set the **Category** text field. **Important:** This must match the category name exactly (case-sensitive).
   * Input the **Question** text.
   * Add the **Answer** text (rich HTML is supported for bold text, paragraphs, or links).
   * **Featured Toggle:** Check the `"Show in featured queries"` box to place this question on both the widget's home panel (under General Queries) and in the storefront home page grid.

---

### 4. Updating Contact Channels
Merchants can toggle and customize three direct contact methods inside the widget's top header:
* **Phone:** Show/hide phone button, enter number, and customize hover tooltip.
* **WhatsApp:** Show/hide chat button, enter phone number (including country code, e.g., `919876543210`), and customize tooltip.
* **Email:** Show/hide email button, enter email address, and customize tooltip.
