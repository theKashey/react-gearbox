declare module 'react-powerplug' {
  import * as React from 'react';

  export type RenderFn<T> = (value: T) => React.ReactNode;

  export class Value<T, K> extends React.Component<{ initial: K, children: RenderFn<{ value: K, set: (data: K) => void }> }, {}> {
  }

  export class Toggle<T> extends React.Component<{ initial?: boolean, children: RenderFn<{ on: boolean, toggle: () => void }> }, {}> {
  }

  export class Map<T> extends React.Component<{
    initial?: T,
    children: RenderFn<{
      set: (key: string | number, value: any) => void,
      get(k: string | number): any,
      values: T
    }>
  }, {}> {
  }

  export class State<T> extends React.Component<{
    initial?: T,
    children: RenderFn<{
      state: T,
      setState(k: Partial<T>): void,
    }>
  }, {}> {
  }


}