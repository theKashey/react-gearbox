import * as React from 'react';
import * as invariant from 'invariant';
import {reactRename} from "react-rename";
import {Diff} from "utility-types";
import {withKnowUsage} from "with-known-usage";
import * as memoizeOneIndex from 'memoize-one';
import {SuppressUpdate, UpdateBlocker} from "./UpdateBlocker";
import {calculateChangedBits, getBits} from "./bits";

const memoizeOne: any = (memoizeOneIndex.default || memoizeOneIndex);

type ExtractProps<T> = T extends React.ComponentType<infer U> ? U : any;
export type RenderableElement<T> = {
  type: T,
  props: Diff<ExtractProps<T>, { children: any }>
  typed: true
}

export declare type ChildrenFn<P> = (props: P) => (JSX.Element | null)
export declare type MapperValue<P, RP> =
  | React.ReactElement<{ children: ChildrenFn<P> }>
  | ChildrenFn<P>
  | RenderableElement<any>;

export declare type IGears<P, RP> = Record<string, MapperValue<P, RP>>

const nop = (): null => null;

export function gear<T>
(type: T, props: Diff<ExtractProps<T>, { children: any }>): RenderableElement<T> {
  const Type = type as any;
  return (<Type {...props} children={nop}/>) as any;
}

export type DebugCallback = (name: string, ...args: any[]) => any;

let debugEnabled: boolean | DebugCallback = false;

declare const process: any;

export const setGearboxDebug = (flag: boolean | DebugCallback) => {
  debugEnabled = flag;
};

export interface IGearOptions<T, P, G = T> {
  copyData?: boolean;
  defaultProps?: {
    render?: boolean;
    local?: boolean;
    name?: string;
    pure?: boolean;
  },
  transmission?: (input: ExtractData<T>, props: P) => G
}

export type IGearbox<P, RP> = P & {
  local?: boolean;
  name?: string;
  pure?: boolean;
} & ({
  render: true;
  children: ChildrenFn<RP>;
} | {
  render?: false;
  children: React.ReactChild;
})

export type ITransmission<RP> = React.SFC<{
  render?: boolean;
  name?: string;
  clutch: (a: RP) => any;
  children: ChildrenFn<RP> | React.ReactChild | undefined
}>;

export type ExtractData<Gears> = {
  [P in keyof Gears]: any;
}

export type GearBoxComponent<P, Gears, Gearings = ExtractData<Gears>> =
  React.ComponentClass<IGearbox<P, Gearings>>
  & {
  train: React.ComponentClass<{ children: ChildrenFn<Gearings> }>,
  directTrain: React.StatelessComponent<{ children: ChildrenFn<Gearings> }>,
  transmission: ITransmission<Gearings>
};

const realTrain = (context: React.Context<any>) => class GearTrain extends React.Component<{ children: ChildrenFn<any> }, { bits: number }> {

  state = {
    bits: 0xFFFFFFFF
  };

  memoizedRender = memoizeOne((fn: (v: any) => any, value: any) => {
    const dataWrapper = withKnowUsage(value);
    const result = fn(dataWrapper.proxy);
    const bits = getBits(value, dataWrapper.usage);
    return {result, bits};
  });

  updateBits = (bits: number) => {
    if (this.state.bits !== bits) {
      this.setState({bits});
    }
  };

  render() {
    return (
      <context.Consumer unstable_observedBits={this.state.bits}>
        {value => {
          invariant(value, "Gearbox.train: parent gearbox was not found");
          const {result, bits} = this.memoizedRender(this.props.children, value);

          return <SuppressUpdate bits={bits} updateBits={this.updateBits}>{result}</SuppressUpdate>;
        }}
      </context.Consumer>
    );
  }
};

const directTrain = (context: React.Context<any>) => ({children}: { children: ChildrenFn<any> }) => (
  <context.Consumer>{value => {
    invariant(value, "Gearbox.train: parent gearbox was not found");
    return children(value)
  }}</context.Consumer>
);

const realTransmission = (context: React.Context<any>): ITransmission<any> => ({clutch, render, children}) => (
  <context.Consumer>{
    oldValues => {
      const newValues: any = clutch(oldValues as any);
      invariant(oldValues, "Gearbox.transmission: parent gearbox was not found");
      render && invariant(typeof children === "function", "Gearbox.transmission: children should be a function in case of `render` prop");
      !render && invariant(typeof children !== "function", "Gearbox.transmission: children should be a ReactNode, when `render` prop is not set");
      const renderChild: any = children;

      return (
        <context.Provider value={newValues}>
          {render
            ? renderChild(newValues)
            : renderChild
          }
        </context.Provider>
      )
    }
  }</context.Consumer>
);

const getName = (type: any) => type.displayName || type.name || 'Component';

const gearName = (type: any, key: string) =>
  process.env.NODE_ENV === 'production'
    ? type
    : reactRename(type, `${key} ⚙️(︎${getName(type)})📦`);

const constructElement = (key: string, obj: any, props: any, prevProps: any, acc: any) => {
  let next = null;
  if (typeof obj === "function") {
    next = obj(props, prevProps);
  }
  if (obj.type) {
    next = obj
  }
  return next
    ? React.cloneElement({...next, type: gearName(next.type, key)}, {}, acc)
    : React.createElement(gearName(obj, key), {}, acc);
};

const debug = (name: string, ...args: any[]) => {
  if (process.env.NODE_ENV !== 'production') {
    if (debugEnabled) {
      if (typeof debugEnabled === 'function') {
        debugEnabled(name, ...args);
      } else {
        console.debug('Gearbox', name || 'unnamed', ...args);
      }
    }
  }
};

export function gearbox<RP, P, Shape = IGears<P, RP>, ResultShape = Shape, GearOptions = IGearOptions<Shape, P, ResultShape>>
(shape: Shape | IGears<P, RP>, options?: GearOptions | IGearOptions<Shape, P, ResultShape>): GearBoxComponent<P, ResultShape> {
  // generator function
  const gearOptions = (options as IGearOptions<Shape, P, ResultShape>) || {};

  const generator = () => {
    let generation = 0;

    let children: any;
    let props: any;

    const result: any = {};
    const pureResult: any = {};
    const storeResult = (acc: (props: any) => {}, key: string) => (data: any) => {
      generation++;
      if (process.env.NODE_ENV !== 'production') {
        if (pureResult[key] !== data && calculateChangedBits(pureResult[key], data)) {
          if (pureResult[key]) {
            debug(props.name, `key ${key} got replaced by`, data, 'old value', pureResult[key]);
          } else {
            debug(props.name, `key ${key} was initialized with`, data);
          }
        }
      }
      pureResult[key] = data;
      result[key] = gearOptions.copyData ? {...data} : data;
      return acc({...result});
    };

    const ExitNode = (prevProps: any) => (
      children(gearOptions.transmission ? gearOptions.transmission(prevProps, props) : {...result})
    );

    const gearings: { [key: string]: React.ReactElement<any> } = {};

    const EntryNode = Object
      .keys(shape)
      .reduce((acc, key) => {
        const obj: any = (shape as any)[key];

        return (prevProps: any) => {
          gearings[key] = gearings[key] || constructElement(key, obj, props, prevProps, storeResult(acc, key));
          return React.cloneElement(gearings[key], {
            gearsSpin: generation
          })
        };
      }, ExitNode);

    return (propOverride: any, childrenOverride: any) => {
      props = propOverride;
      children = childrenOverride;
      return React.createElement(EntryNode);
    };
  };

  const context = React.createContext({}, calculateChangedBits);

  class Gearbox extends React.Component<IGearbox<P, ExtractData<ResultShape>>> {
    private generator = generator();
    static train = realTrain(context);
    static directTrain = directTrain(context);
    static transmission: ITransmission<ExtractData<ResultShape>> = realTransmission(context);

    onRender = (data: any) => {
      const {defaultProps = {}} = gearOptions;
      const {render = defaultProps.render, children, local = defaultProps.local, pure = defaultProps.pure} = this.props;
      if (process.env.NODE_ENV !== 'production') {
        render && invariant(typeof children === "function", "Gearbox: children should be a function in case of `render` prop");
        !render && invariant(typeof children !== "function", "Gearbox: children should be a ReactNode, when `render` prop is not set");
      }
      const renderChild: any = children;

      let next;
      if (render) {
        if (pure) {
          next = <UpdateBlocker value={data} render={renderChild}/>
        } else {
          next = renderChild(data);
        }
      } else {
        if (pure) {
          next = <UpdateBlocker value={data}>{children}</UpdateBlocker>
        } else {
          next = children;
        }
      }

      return local
        ? next
        : <context.Provider value={data}>{next}</context.Provider>
    };

    render() {
      return this.generator(this.props, this.onRender);
    }
  }

  return Gearbox;
}

export function transmission<RP, NP, HP>(gearBox: GearBoxComponent<any, any, RP>, clutch: (a: Partial<RP>, props?: HP) => NP): GearBoxComponent<HP, NP, NP> {
  const context = React.createContext({});

  const RenderGear: any = ({render, children, ...rest}: { render: boolean, children: any, rest: any[] }) => (
    <gearBox.train>
      {
        oldValues => {
          const newValues: any = clutch(oldValues as any, rest as any);
          if (process.env.NODE_ENV !== 'production') {
            render && invariant(typeof children === "function", "Gearbox.Transmission: children should be a function in case of `render` prop");
            !render && invariant(typeof children !== "function", "Gearbox.Transmission: children should be a ReactNode, when `render` prop is not set");
          }
          const renderChild: any = children;

          return (
            <context.Provider value={newValues}>
              {render
                ? renderChild(newValues)
                : renderChild
              }
            </context.Provider>
          )
        }
      }
    </gearBox.train>
  );

  RenderGear.train = realTrain(context);
  RenderGear.directTrain = directTrain(context);
  RenderGear.transmission = realTransmission(context);

  return RenderGear;
}