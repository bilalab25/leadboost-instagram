declare global {
  namespace JSX {
    interface IntrinsicElements {
      "gmp-place-autocomplete": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          ref?: React.Ref<any>;
          "api-key"?: string;
          placeholder?: string;
          class?: string; // deja class por compatibilidad
          className?: string; // 🔹 agrega className también
        },
        HTMLElement
      >;
    }
  }
}

export {};
