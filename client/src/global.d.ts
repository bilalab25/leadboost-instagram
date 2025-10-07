declare global {
  namespace JSX {
    interface IntrinsicElements {
      'gmp-place-autocomplete': {
        ref?: React.Ref<any>;
        'api-key'?: string;
        placeholder?: string;
        class?: string;
        id?: string;
        children?: React.ReactNode;
      };
    }
  }
}

export {};
