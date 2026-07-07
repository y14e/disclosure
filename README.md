# Disclosure

WAI-ARIA compliant [disclosure](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/) pattern implementation in TypeScript. Using the `<details>` and `<summary>` element.

## Install

```bash
npm i @y14e/disclosure
```

```ts
// npm
import Disclosure from '@y14e/disclosure';

// CDNs
import Disclosure from 'https://esm.sh/@y14e/disclosure@2.0.2';
// or
import Disclosure from 'https://cdn.jsdelivr.net/npm/@y14e/disclosure@2.0.2/+esm';
// or
import Disclosure from 'https://esm.unpkg.com/@y14e/disclosure@2.0.2';
```

## Usage

```ts
new Disclosure(root, options);
// => Disclosure
//
// root: HTMLElement
// options (optional): DisclosureOptions
```

## 🪄 Options

```ts
interface DisclosureOptions {
  animation?: {
    duration?: number;   // ms (default: 300)
    easing?: string;     // <easing-function> (default: 'ease')
  };
  collapsible?: boolean; // default: true
}
```

### ⚙️ Customize defaults

Override the global default settings applied to all disclosure instances.

```ts
import Disclosure from '@y14e/disclosure';

Disclosure.defaults = {
  animation: {
    duration: 1000,
  },
};

new Disclosure(root);
```

## 📦 APIs

### `collapse`

```ts
disclosure.collapse(details);
// => void
//
// details: HTMLDetailsElement
```

### `destroy`

Destroys the instance and cleans up all event listeners.

```ts
disclosure.destroy(force);
// => Promise<void>
//
// force (optional): If true, skips waiting for animations to finish.
```

### `expand`

```ts
disclosure.expand(details);
// => void
//
// details: HTMLDetailsElement
```

## Demo

- https://y14e.github.io/disclosure/
