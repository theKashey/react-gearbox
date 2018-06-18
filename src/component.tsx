import * as React from 'react';
import * as invariant from 'invariant';
import * as shallowEqual from "shallowequal";

export declare type ChildrenFn<P> = (props: P) => (JSX.Element | null)
export declare type MapperValue<P, RP> = React.ReactElement<{ children: ChildrenFn<P> }> | ChildrenFn<P>;
export declare type IGears<P, RP> = Record<string, MapperValue<P, RP>>

let debugEnabled = false;

export const setGearboxDebug = (flag: boolean) => {
  debugEnabled = flag;
}

export interface IGearOptions<T, P, G = T> {
  copyData?: boolean;
  defaultProps?: {
    render?: boolean,
    local?: boolean,
    name?: string
  },
  transmission?: (input: ExtractData<T>, props: P) => G
}

export type IGearbox<P, RP> = P & {
  render?: boolean;
  local?: boolean;
  name?: string;
  children: ChildrenFn<RP> | React.ReactChild
}

export type ITransmission<RP> = React.SFC<{
  render?: boolean;
  name?: string;
  clutch: (a: RP) => any;
  children: ChildrenFn<RP> | React.ReactChild | undefined
}>;

// type RenderElementFactory<T> = (props:any) => React.ReactElement<{ children: ChildrenFn<T> }>;
// type RenderElement<T> = React.ReactElement<{ children: ChildrenFn<T>}>;

export type ExtractData<Gears> = {
  [P in keyof Gears]:
    // Gears[P] extends RenderElement<infer U> ? U :
    //  Gears[P] extends RenderElementFactory<infer U> ? U :
        any
}

export type GearBoxComponent<P, Gears, Gearings = ExtractData<Gears>> =
  React.ComponentClass<IGearbox<P, Gearings>>
  & {
  train: React.StatelessComponent<{ children: ChildrenFn<Gearings> }>,
  transmission: ITransmission<Gearings>
};

const realTrain = (context: React.Context<any>) => ({children}: { children: ChildrenFn<any> }) => (
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

const constructElement = (obj: any, props: any, prevProps: any, acc: any) => {
  if (typeof obj === "function") {
    return React.cloneElement(obj(props, prevProps), {}, acc)
  }
  if (obj.type) {
    return React.cloneElement(obj, {}, acc);
  }
  return React.createElement(obj, {}, acc);
};

const debug = (name: string, ...args: any[]) => {
  if (debugEnabled) {
    console.debug('Gearbox', name || 'undefined', ...args);
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
      if (pureResult[key] !== data && !shallowEqual(pureResult[key], data)) {
        if (pureResult[key]) {
          debug(props.name, `key ${key} got replaced by`, data, 'old value', pureResult[key]);
        } else {
          debug(props.name, `key ${key} was initialized with`, data);
        }
      }
      pureResult[key] = data;
      result[key] = gearOptions.copyData ? {...data} : data;
      return acc({...result});
    };

    const ExitNode = (prevProps: any) => (
      children(gearOptions.transmission ? gearOptions.transmission(prevProps, props) : {...result})
    );

    const EntryNode = Object
      .keys(shape)
      .reduce((acc, key) => {
        const obj: any = (shape as any)[key];

        return (prevProps:any) => React.cloneElement(constructElement(obj, props, prevProps, storeResult(acc, key)), {
          gearsSpin: generation
        });
      }, ExitNode);

    return (propOverride: any, childrenOverride: any) => {
      props = propOverride;
      children = childrenOverride;
      return React.createElement(EntryNode);
    };
  };

  const context = React.createContext({});

  class Gearbox extends React.Component<IGearbox<P, ExtractData<ResultShape>>> {
    private generator = generator();
    static train = realTrain(context);
    static transmission: ITransmission<ExtractData<ResultShape>> = realTransmission(context);

    onRender = (data: any) => {
      const {defaultProps = {}} = gearOptions;
      const {render = defaultProps.render, children, local = defaultProps.local} = this.props;
      render && invariant(typeof children === "function", "Gearbox: children should be a function in case of `render` prop");
      !render && invariant(typeof children !== "function", "Gearbox: children should be a ReactNode, when `render` prop is not set");
      const renderChild: any = children;
      const rendered = render ? renderChild(data) : renderChild;
      return local
        ? rendered
        : <context.Provider value={data}>{rendered}</context.Provider>
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
          render && invariant(typeof children === "function", "Gearbox.Transmission: children should be a function in case of `render` prop");
          !render && invariant(typeof children !== "function", "Gearbox.Transmission: children should be a ReactNode, when `render` prop is not set");
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

  const transmission: ITransmission<RP> = realTransmission(context);
  const train = realTrain(context);

  RenderGear.train = train;
  RenderGear.transmission = transmission;

  return RenderGear;// as GearBoxComponent<P, RP>;
}