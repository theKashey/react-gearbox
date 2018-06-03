import * as React from 'react';
import * as invariant from 'invariant';

export declare type ChildrenFn<P> = (props: P) => JSX.Element | null
export declare type MapperValue<P, RP> = React.ReactElement<any> | ChildrenFn<P>;
export declare type IGears<P, RP> = Record<string, MapperValue<P, RP>>

export interface IGearOptions {
  copyData?: boolean;
}

export type IGearbox<P, RP> = P & {
  render?: boolean;
  children: ChildrenFn<RP> | React.ReactChild
}

export type ITransmition<RP> = React.SFC<{
  render?: boolean;
  clutch: (a: RP) => any;
  children: ChildrenFn<RP> | React.ReactChild | undefined
}>;

export type ExtractData<Gears> = {
  [P in keyof Gears]: any;
}

export type GearBoxComponent<P, Gears, Gearings = ExtractData<Gears>> = React.StatelessComponent<IGearbox<P, Gearings>> & {
  train: React.StatelessComponent<{ children: ChildrenFn<Gearings> }>,
  transmission: ITransmition<Gearings>
};

const realTrain = (context: React.Context<any>) => ({children}: { children: ChildrenFn<any> }) => (
  <context.Consumer>{value => children(value)}</context.Consumer>
);

const realTransmition = (context: React.Context<any>): ITransmition<any> => ({clutch, render, children}) => (
  <context.Consumer>{
    oldValues => {
      const newValues: any = clutch(oldValues as any);
      render && invariant(typeof children === "function", "Gearbox.transmition: children should be a function in case of `render` prop");
      !render && invariant(typeof children !== "function", "Gearbox.transmition: children should be a ReactNode, when `render` prop is not set");
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

const constructElement = (obj: any, props: any, acc: any) => {
  if (typeof obj === "function") {
    return React.cloneElement(obj(props), {}, acc)
  }
  if (obj.type) {
    return React.cloneElement(obj, {}, acc);
  }
  return React.createElement(obj, {}, acc);
}

export function gearbox<RP, P, Shape = IGears<P, RP>>(shape: Shape | IGears<P, RP>, options: IGearOptions = {}): GearBoxComponent<P, Shape> {
  // generator function
  const generator = (props: any) => {
    let generation = 0;
    let children: any = props.children;

    const result: any = {props};
    const storeResult = (acc: () => {}, key: string) => (data: any) => {
      generation++;
      result[key] = options.copyData ? {...data} : data;
      return acc();
    };

    const ExitNode = () => children({...result});

    const EntryNode = Object
      .keys(shape)
      .reduce((acc, key) => {
        const obj: any = (shape as any)[key];
        const next = constructElement(obj, props, storeResult(acc, key));

        return () => React.cloneElement(next, {
          gearsSpin: generation
        });
      }, ExitNode);

    return (childrenOverride: any) => {
      children = childrenOverride;
      return React.createElement(EntryNode);
    };
  };

  const context = React.createContext({})

  class Gearbox extends React.Component<IGearbox<P, RP>> {
    generator = generator(this.props);

    onRender = (data: any) => {
      const {render, children} = this.props;
      render && invariant(typeof children === "function", "Gearbox: children should be a function in case of `render` prop");
      !render && invariant(typeof children !== "function", "Gearbox: children should be a ReactNode, when `render` prop is not set");
      const renderChild: any = children
      return (
        <context.Provider value={data}>
          {render ? renderChild(data) : renderChild}
        </context.Provider>
      )
    };

    render() {
      return this.generator(this.onRender);
    }
  }

  const RenderGear: any = (props: any) => <Gearbox {...props} />;

  const train = realTrain(context);
  const transmission: ITransmition<RP> = realTransmition(context);

  RenderGear.train = train;
  RenderGear.transmission = transmission;

  return RenderGear;
}

export function transmition<RP, NP, HP>(gearBox: GearBoxComponent<any, any, RP>, clutch: (a: Partial<RP>, props?: HP) => NP): GearBoxComponent<HP, NP, NP> {
  const context = React.createContext({});

  const RenderGear: any = ({render, children, ...rest}: { render: boolean, children: any, rest: any[] }) => (
    <gearBox.train>
      {
        oldValues => {
          const newValues: any = clutch(oldValues as any, rest as any);
          render && invariant(typeof children === "function", "Gearbox.Transmition: children should be a function in case of `render` prop");
          !render && invariant(typeof children !== "function", "Gearbox.Transmition: children should be a ReactNode, when `render` prop is not set");
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

  const transmission: ITransmition<RP> = realTransmition(context);
  const train = realTrain(context);

  RenderGear.train = train;
  RenderGear.transmission = transmission;

  return RenderGear;// as GearBoxComponent<P, RP>;
}