declare global {
  namespace JSX {
    interface IntrinsicElements {
      'gmp-place-autocomplete': React.DetailedHTMLProps<
        Omit<React.HTMLAttributes<HTMLElement>, 'className'> & {
          ref?: React.Ref<any>;
          'api-key'?: string;
          placeholder?: string;
          class?: string;
        },
        HTMLElement
      >;
    }
  }
}

export {};
