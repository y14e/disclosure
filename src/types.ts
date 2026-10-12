export interface DisclosureOptions {
  animation: {
    duration: number;
    easing: string;
  };
  collapsible: boolean;
}

export type Binding = {
  animation: Animation | null;
  content: HTMLElement;
  details: HTMLDetailsElement;
  summary: HTMLElement;
};
