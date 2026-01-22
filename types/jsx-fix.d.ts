import type { JSX as ReactJSX } from "react";

// Force the global JSX namespace to use React's JSX types.
// This fixes errors like: Property 'div' does not exist on type 'JSX.IntrinsicElements'.

declare global {
  namespace JSX {
    type Element = ReactJSX.Element;
    interface ElementClass extends ReactJSX.ElementClass {}
    interface ElementAttributesProperty extends ReactJSX.ElementAttributesProperty {}
    interface ElementChildrenAttribute extends ReactJSX.ElementChildrenAttribute {}
    interface IntrinsicAttributes extends ReactJSX.IntrinsicAttributes {}
    interface IntrinsicClassAttributes<T> extends ReactJSX.IntrinsicClassAttributes<T> {}
    interface IntrinsicElements extends ReactJSX.IntrinsicElements {}
  }
}

export {};
