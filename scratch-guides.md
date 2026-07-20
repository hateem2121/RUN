
--- Guide for agentic-forms ---
The Declarative API transforms standard HTML `<form>` elements into WebMCP tools via attributes. The browser synthesizes a JSON Schema from the form inputs and handles agent interactions.

## Form Attributes

*   `toolname`: Unique name for the tool.
*   `tooldescription`: Purpose of the tool.
*   `toolautosubmit`: (Optional) If present, the agent can submit the form without waiting for user interaction. 
*   `toolparamdescription`: (Optional) Provides a way to define a property description within the JSON Schema.
    *   **Resolution Order**: The browser uses `toolparamdescription` if present. In its absence, it uses the `textContent` of the associated `<label>` (skipping labelable descendants). If no label exists, it falls back to the `aria-description`.
    *   **Grouping (Fieldsets)**: To attach a description to a group of related elements (like `<input type="radio">` buttons), place `toolparamdescription` on the nearest parent `<fieldset>` element so it applies to the parameter group as a whole.

### Example

```html
<form toolname="search-cars" 
      tooldescription="Perform a car make/model search" 
      toolautosubmit>
  <label for="make">Vehicle Make</label>
  <input type="text" id="make" name="make" required>
  
  <label for="model">Vehicle Model</label>
  <input type="text" id="model" name="model" toolparamdescription="e.g., 330i, F-150" required>
  
  <button type="submit">Search</button>
</form>
```

## Handling Submissions in JavaScript

When an agent submits the form, the `SubmitEvent` includes `agentInvoked` (boolean) and `respondWith(promise)`.

```javascript
document.querySelector('form').addEventListener('submit', (event) => {
  event.preventDefault();

  // Validate the form
  const formValidationErrors = myFormIsValid();

  if (formValidationErrors.length > 0) {
    if (event.agentInvoked) {
      const errorString =
        'Validation failed: ' +
        formValidationErrors
          .map((err) => `${err.field} (${err.message})`)
          .join(', ');

      event.respondWith(Promise.resolve(errorString));
    }
    return;
  }

  const resultPromise = performAsyncSearch(new FormData(event.target));

  // Return the result directly to the agent without navigation
  if (event.agentInvoked) {
    event.respondWith(resultPromise);
  }
});
```

## Lifecycle Events

The window emits events when agents start or stop interacting with a tool:

```javascript
window.addEventListener('toolactivated', ({ toolName }) => {
  console.log(`Tool "${toolName}" was activated by the agent.`);
});

window.addEventListener('toolcancel', ({ toolName }) => {
  console.log(`Tool "${toolName}" interaction was cancelled.`);
});
```

## Visual Feedback (CSS)

Use pseudo-classes to highlight forms when an agent interacts with them:

*   `:tool-form-active`: Applied to the `<form>` element actively used by the agent.
*   `:tool-submit-active`: Applied to the submit button when the browser pauses for user review (if `toolautosubmit` is omitted).

```css
form:tool-form-active {
  outline: 2px dashed blue;
  background-color: rgba(0, 0, 255, 0.05);
}

button:tool-submit-active {
  outline: 2px dashed red;
  animation: pulse 2s infinite;
}
```

## Form Suitability (When to Avoid)

The Declarative API is best for self-contained, standard forms. It is a poor choice in these scenarios:

* **Highly Dependent Fields**: Forms where inputs change options or visibility based on other inputs. The synthesized schema cannot express these dependencies well.
* **Custom UI Components**: Forms relying on non-standard inputs (e.g., canvas, rich text editors) that don't auto-serialize values.
* **Multi-Step Wizards**: Complex workflows requiring multiple form submissions. The Imperative API or standard DOM interaction is better suited here.

## When to use toolautosubmit
* **Read-Only Operations & Queries**: Searches, filters, fetching details, or checking status (e.g., a car model search, searching a directory, checking stock availability).
* **Low-Risk, Reversible Actions**: Form actions that can easily be undone or refined by the user manually (e.g., adding items to a cart, applying a coupon code, saving a draft, or setting temporary layout options).

## When to omit toolautosubmit
* **Destructive or Irreversible Actions**: Deleting records, resetting system configurations, or clearing databases.
* **Financial & Transactional Actions**: Submitting a checkout form, transferring funds, authorizing subscription payments, or final order placements.
* **High-Impact User Communication**: Submitting a final job application, sending emails/messages to other real users, or publishing public-facing content.
* **Sensitive Account Settings**: Changing passwords, modifying user roles/permissions, or updating billing/profile info.

## Fallback strategies

Form-associated WebMCP attributes is not natively supported by any major browser yet.

The WebMCP Declarative API is safe to use in all browsers. Browsers that do not support WebMCP will ignore the `tool*` attributes, and the `<form>` will continue to function as a normal HTML form. No feature detection is required.


--- Guide for scroll-entry-exit-effects ---
# Add entry and exit effects to elements as they enter or exit the scrollport

Entry and exit effects are animations that are triggered when an element enters or leaves the viewport. This can be used to create engaging and dynamic user experiences. For example, you can use an entry effect to fade in an element as it scrolls into view, or an exit effect to scale it down as it scrolls out of view.

## How to implement

To add entry and exit effects to an element, you need to combine a few CSS properties. Here’s a step-by-step guide:

1.  **Create separate `@keyframes` for the entry and exit animations.** The entry animation will be applied as the element enters the viewport, and the exit animation will be applied as it leaves.

    ```css
    @keyframes slide-in {
      from { transform: translateX(-100%); }
    }
    @keyframes slide-out {
      to { transform: translateX(100%); }
    }
    ```

2.  **Attach the entry and exit keyframes to the element.** You can do this by defining multiple animations in the `animation` property.

    -   Give the entry animation an `animation-fill-mode` of `backwards` so that it applies its initial state before the animation starts.
    -   Give the exit animation an `animation-fill-mode` of `forwards` so that it maintains its final state after the animation is complete.

    ```css
    .animated-element {
      animation:
        slide-in 1s linear backwards,
        slide-out 1s linear forwards;
    }
    ```

3.  **Create a View Timeline and link it to the animations.** A View Timeline is a type of timeline that is linked to the visibility of an element in the viewport. You can create one using the `view()` function and then apply it to your animations using the `animation-timeline` property.

    ```css
    .animated-element {
      animation-timeline: view();
    }
    ```

    By default, `view()` tracks the element on the `block` axis. If you need to track it on the `inline` axis, you can use `view(inline)`.

4.  **Limit the animations to the `entry` and `exit` ranges.** The `animation-range` property allows you to specify which part of the timeline an animation should run on.

    -   The `entry` range covers the time from when the element first enters the viewport until it is fully visible.
    -   The `exit` range covers the time from when the element starts to leave the viewport until it is completely hidden.

    ```css
    .animated-element {
      animation-range: entry, exit;
    }
    ```

## Example code

This code animates the direct children of the scroller on scroll using an **anonymous view-timeline**:

```css
@media (prefers-reduced-motion: no-preference) {
  @supports ((animation-timeline: view()) and (animation-range: entry)) {
    @keyframes grow {
      from {
        scale: 0.5;
      }
    }
    @keyframes shrink {
      to {
        scale: 0.5;
      }
    }

    .scroller > * {
      animation:
        grow auto linear backwards,
        shrink auto linear forwards;
      animation-timeline: view(inline);
      animation-range: entry, exit;
    }
  }
}
```

As the elements enter the scrollport the `grow` animation is played, and as they leave the scrollport the `shrink` animation is played.

The following code has the same visual outcome, but animates the direct children of the scroller on scroll using an **named view-timeline**:

```css
@media (prefers-reduced-motion: no-preference) {
  @supports ((animation-timeline: view()) and (animation-range: entry)) {
    @keyframes grow {
      from {
        scale: 0.5;
      }
    }
    @keyframes shrink {
      to {
        scale: 0.5;
      }
    }

    .scroller > * {
      view-timeline: --tl inline;
      animation:
        grow auto linear backwards,
        shrink auto linear forwards;
      animation-timeline: --tl;
      animation-range: entry, exit;
    }
  }
}
```

## Best Practices

When using scroll-driven animations, it's important to follow a few best practices to ensure a smooth and accessible experience:

- **DO** include feature detection: Not all browsers support scroll-driven animations. Use `@supports ((animation-timeline: view()) and (animation-range: entry))` to check for support and provide a fallback for browsers that don't support it.
  - The `(animation-range: entry)` check **MUST** be included here, to filter out browsers with only partial support.
  - **DO NOT** use the `scroll-timeline-polyfill` package for the fallback strategy as it is not feature complete and has a lot of known issues.
  - If the animation is only considered to be decorative, opt for Progressive Enhancement and **DO NOT** provide a fallback.
- **DO** respect user preferences: Some users prefer to have less motion on the web. Use the `prefers-reduced-motion` media query to disable or reduce your animations for these users.
- **DO** try to animate only performant CSS properties: For the smoothest animations, stick to animating properties that can be handled by the browser's compositor thread, such as `transform` and `opacity`. Animating other properties like `width` or `height` can lead to performance issues.
- **DO** use the correct declaration order: When using the `animation` shorthand property, declare `animation-timeline` *after* it to prevent the shorthand from resetting the timeline.

When using the `view()` function to create a scroll-driven animation:

- **OPTIONAL** be explicit about the axis to track: When not targeting the default `block` axis (such as in a horizontal scroller), be explicit about which axis to track with `view(block)` or `view(inline)`.
- When the animation is not applied to the tracked subject itself, use a named view timeline.

When using the `view-timeline` property to create a scroll-driven animation:

- **DO** use a CSS `<dashed-ident>` for the name.
- **OPTIONAL** be explicit about the axis to track: When not targeting the default `block` axis (such as in a horizontal scroller), be explicit about which axis to track with `view-timeline-axis`.
- **DO** make sure the scope of the lookup works: When the element that is declaring the `view-timeline` is not a flat tree ancestor of the animated element, hoist up the visibility of the `view-timeline`’s name by using `timeline-scope` on a shared ancestor.

Prefer a named `view-timeline` when multiple elements or children of the tracked subject need to animate.

## Browser support and fallback strategies

Scroll-driven animations has limited availability.
Supported by: Chrome 115 (Jul 2023), Edge 115 (Jul 2023), and Safari 26 (Sep 2025).
Unsupported in: Firefox.. Therefore, a fallback strategy is typically required.

For browsers that do not support scroll-driven animations, you can use a fallback to recreate the visual effects. The fallbacks are typically built with either a scroll listener (for ScrollTimeline effects) or the IntersectionObserver API (for ViewTimeline effects).

In browsers with built-in support for scroll-driven animations, ALWAYS use the native CSS implementation as those are more performant.

Note that not every effect can be recreated using the fallbacks approach.

For this use-case specifically, the following script applies the fallback for browsers that do not support scroll-driven animations. It uses an `IntersectionObserver` to track the visibility of the `.wrapper` element and updates the `transform` property of the layers based on the scroll position.

```html
<script>
  if (!CSS.supports('(animation-timeline: view()) and (animation-range: entry)')) {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          // This matches the effect as defined in the CSS example above.
          // Customize this further if needed.
          entry.target.style.scale = 0.5 + entry.intersectionRatio * 0.5;
        }
      },
      {
        threshold: Array.from({ length: 101 }, (_, i) => i / 100),
      }
    );

    document.querySelectorAll('.scroller > *').forEach((el) => {
      observer.observe(el);
    });
  }
</script>
```

