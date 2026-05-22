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
import Disclosure from 'https://esm.sh/@y14e/disclosure'
// or
import Disclosure from 'https://cdn.jsdelivr.net/npm/@y14e/disclosure/+esm';
// or
import Disclosure from 'https://unpkg.com/@y14e/disclosure/dist/index.js';
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
    duration?: number; // ms (default: 300)
    easing?: string;   // <easing-function> (default: 'ease')
  };
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

### `open`

```ts
disclosure.open(details);
// => void
//
// details: HTMLDetailsElement
```

### `close`

```ts
disclosure.close(details);
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

## Demo

- https://y14e.github.io/disclosure-ts/
