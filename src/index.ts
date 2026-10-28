import { restoreAttributes, saveAttributes } from '@y14e/attribute-utils';
import { createRovingTabIndex } from '@y14e/roving-tabindex';
import { defaults } from './defaults';
import { resolveOptions } from './options';
import type { Binding, DisclosureOptions as Options } from './types';

export class Disclosure {
  static defaults: Partial<Options> = {};

  #rootElement!: HTMLElement;
  #settings!: Options;
  #detailsElements!: HTMLDetailsElement[];
  #summaryElements!: HTMLElement[];
  #contentElements!: HTMLElement[];
  #bindings = new WeakMap<HTMLElement, Binding>();
  #eventController: AbortController | null = null;
  #animationController: AbortController | null = null;
  #observers: MutationObserver[] = [];
  #cleanupRovingTabIndex: (() => void) | null = null;
  #isDestroyed = false;

  constructor(root: HTMLElement, options: Partial<Options> = {}) {
    if (!(root instanceof HTMLElement)) {
      throw new TypeError('Invalid root element');
    }

    if (root.hasAttribute('data-disclosure-initialized')) {
      console.warn('Already initialized');
      return;
    }

    this.#rootElement = root;
    this.#settings = resolveOptions(
      resolveOptions(defaults, Disclosure.defaults),
      options,
    );

    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.#settings.animation.duration = 0;
    }

    const NOT_NESTED = ':not(:scope summary + * *)';
    this.#detailsElements = [
      ...this.#rootElement.querySelectorAll<HTMLDetailsElement>(
        `details${NOT_NESTED}`,
      ),
    ];

    if (!this.#detailsElements.length) {
      console.warn('Missing <details> elements');
      return;
    }

    this.#summaryElements = [
      ...this.#rootElement.querySelectorAll<HTMLElement>(
        `summary${NOT_NESTED}`,
      ),
    ];

    if (!this.#summaryElements.length) {
      console.warn('Missing <summary> elements');
      return;
    }

    this.#contentElements = [
      ...this.#rootElement.querySelectorAll<HTMLElement>(
        `summary${NOT_NESTED} + *`,
      ),
    ];

    if (!this.#contentElements.length) {
      console.warn('Missing content elements');
      return;
    }

    this.#detailsElements.forEach((details, i) => {
      const summary = this.#summaryElements[i];
      const content = this.#contentElements[i];

      if (!summary || !content) {
        return;
      }

      const binding = this.#createBinding(details, summary, content);

      [details, summary, content].forEach((element) => {
        this.#bindings.set(element, binding);
      });
    });

    this.#initialize();
  }

  collapse(details: HTMLDetailsElement): void {
    if (this.#isDestroyed) {
      return;
    }

    if (
      !(details instanceof HTMLDetailsElement) ||
      !this.#bindings.has(details)
    ) {
      console.warn('Invalid <details> element');
      return;
    }

    this.#toggle(details, false);
  }

  async destroy(force = false): Promise<void> {
    if (this.#isDestroyed) {
      return;
    }

    this.#isDestroyed = true;
    this.#eventController?.abort();
    this.#eventController = null;

    for (const observer of this.#observers) {
      observer.disconnect();
    }

    this.#observers.length = 0;
    this.#cleanupRovingTabIndex?.();
    this.#cleanupRovingTabIndex = null;
    !force && (await this.#waitAnimationsFinish());

    for (const content of this.#contentElements) {
      force && this.#bindings.get(content)?.animation?.finish();
      this.#onContentAnimationFinish(content);
    }

    this.#animationController?.abort();
    this.#animationController = null;

    for (const details of this.#detailsElements) {
      for (const name of ['name', 'open']) {
        details.removeAttribute(`data-disclosure-${name}`);
      }
    }

    this.#detailsElements.length = 0;
    restoreAttributes(this.#summaryElements);
    this.#summaryElements.length = 0;
    this.#contentElements.length = 0;
    this.#rootElement.removeAttribute('data-disclosure-initialized');
  }

  expand(details: HTMLDetailsElement): void {
    if (this.#isDestroyed) {
      return;
    }

    if (
      !(details instanceof HTMLDetailsElement) ||
      !this.#bindings.has(details)
    ) {
      console.warn('Invalid <details> element');
      return;
    }

    this.#toggle(details, true);
  }

  #initialize(): void {
    saveAttributes(this.#summaryElements, [
      'aria-disabled',
      'style',
      'tabindex',
    ]);
    this.#eventController = new AbortController();
    const { signal } = this.#eventController;

    this.#detailsElements.forEach((details, i) => {
      details.name &&
        details.setAttribute('data-disclosure-name', details.name);

      function onMutate(): void {
        details.toggleAttribute('data-disclosure-open', details.open);
      }

      const observer = new MutationObserver(onMutate);
      observer.observe(details, { attributeFilter: ['open'] });
      this.#observers.push(observer);
      onMutate();
      const summary = this.#summaryElements[i];

      if (!summary) {
        return;
      }

      if (!this.#isFocusable(summary)) {
        summary.setAttribute('aria-disabled', 'true');
        summary.setAttribute('tabindex', '-1');
        summary.style.setProperty('pointer-events', 'none');
      }

      summary.addEventListener('click', this.#onSummaryClick, { signal });
    });

    this.#cleanupRovingTabIndex = createRovingTabIndex(this.#rootElement, {
      direction: 'vertical',
      navigationOnly: true,
      selector: 'summary:not(:scope summary + * *)',
      wrap: true,
    });
    this.#rootElement.setAttribute('data-disclosure-initialized', '');
  }

  #onSummaryClick = (event: MouseEvent): void => {
    event.preventDefault();
    const summary = event.currentTarget;

    if (!(summary instanceof HTMLElement)) {
      return;
    }

    const details = this.#bindings.get(summary)?.details;
    details &&
      this.#toggle(details, !details.hasAttribute('data-disclosure-open'));
  };

  #onContentAnimationFinish(content: HTMLElement): void {
    const details = this.#bindings.get(content)?.details;

    if (!details) {
      return;
    }

    const name = details.getAttribute('data-disclosure-name');
    name && details.setAttribute('name', name);

    if (!details.hasAttribute('data-disclosure-open')) {
      details.open = false;
    }

    for (const name of ['block-size', 'overflow']) {
      content.style.removeProperty(name);
    }
  }

  #toggle(
    details: HTMLDetailsElement,
    isExpand: boolean,
    isProgrammatic = false,
  ): void {
    if (details.hasAttribute('data-disclosure-open') === isExpand) {
      return;
    }

    if (
      !isExpand &&
      !isProgrammatic &&
      !this.#settings.collapsible &&
      this.#detailsElements.filter((d) =>
        d.hasAttribute('data-disclosure-open'),
      ).length <= 1
    ) {
      return;
    }

    const name = details.getAttribute('data-disclosure-name');

    if (name && isExpand) {
      details.removeAttribute('name');
      const expanded = this.#detailsElements.find(
        (d) =>
          d.hasAttribute('data-disclosure-open') &&
          d.getAttribute('data-disclosure-name') === name,
      );
      expanded && this.#toggle(expanded, false, true);
    }

    const binding = this.#bindings.get(details);

    if (!binding) {
      return;
    }

    const { content } = binding;
    const startSize = details.open ? content.offsetHeight : 0;
    binding.animation?.cancel();

    if (isExpand) {
      details.open = true;
    }

    const endSize = isExpand ? content.scrollHeight : 0;
    binding.animation?.cancel();
    details.toggleAttribute('data-disclosure-open', isExpand);
    content.style.setProperty('overflow', 'clip');
    const { duration, easing } = this.#settings.animation;
    const animation = content.animate(
      { blockSize: [`${startSize}px`, `${endSize}px`] },
      { duration, easing },
    );
    binding.animation = animation;

    function cleanup(): void {
      if (binding?.animation === animation) {
        binding.animation = null;
      }
    }

    this.#animationController = new AbortController();
    const { signal } = this.#animationController;
    animation.addEventListener('cancel', cleanup, { once: true, signal });

    animation.addEventListener(
      'finish',
      () => {
        if (binding?.animation === animation) {
          this.#onContentAnimationFinish(content);
          cleanup();
        }
      },
      { once: true, signal },
    );
  }

  #createBinding(
    details: HTMLDetailsElement,
    summary: HTMLElement,
    content: HTMLElement,
  ): Binding {
    return { animation: null, content, details, summary };
  }

  #isFocusable(element: HTMLElement): boolean {
    return element.tabIndex >= 0;
  }

  async #waitAnimationsFinish(): Promise<void> {
    const promises: Promise<void>[] = [];

    for (const content of this.#contentElements) {
      const animation = this.#bindings.get(content)?.animation;
      animation && promises.push(waitAnimationFinish(animation));
    }

    await Promise.allSettled(promises);
  }
}

function waitAnimationFinish(animation: Animation): Promise<void> {
  return ['finished', 'idle'].includes(animation.playState)
    ? Promise.resolve()
    : new Promise((resolve) =>
        animation.addEventListener('finish', () => resolve(), { once: true }),
      );
}

export type { Options as DisclosureOptions };
