import * as React from 'react';
import * as TestRenderer from 'react-test-renderer';
import {gearbox, transmition} from "../src";
import {Value} from "react-powerplug";

describe('Specs', () => {
  it('combine in all forms', () => {
    const context1 = React.createContext({v: 1});
    const context2 = React.createContext("42");

    const Gearbox = gearbox({
      context0: context1.Consumer as any,
      context1: <context1.Consumer children={null}/>,
      context2: () => <context2.Consumer children={null}/>,
    });

    const testRenderer = TestRenderer.create(
      <Gearbox render>
        {({context0, context1, context2}) => (
          <div>
            <span>{context0.v} - {context1.v} + {context2}</span>
            <Gearbox.train>
              {({context2: ctx}) => <i>{"42" + ctx}</i>}
            </Gearbox.train>
          </div>
        )}
      </Gearbox>
    );

    expect(testRenderer.root.findByType('span').children).toEqual(["1", " - ", "1", " + ", "42"]);
  });

  it('top level transmition', () => {
    const context1 = React.createContext({v: 1});
    const context2 = React.createContext({v: 2});

    const Gearbox = gearbox({
      context0: context1.Consumer as any,
      context1: <context1.Consumer children={null}/>,
      context2: () => <context2.Consumer children={null}/>,
    }, {
      transmition: ({context0, context1, context2}) => ({sum:context0.v+context1.v+context2.v})
    });

    const testRenderer = TestRenderer.create(
      <Gearbox render>
        {({sum}) => (
          <span>{sum}</span>
        )}
      </Gearbox>
    );

    expect(testRenderer.root.findByType('span').children).toEqual(["4"]);
  });

  it('train', () => {
    const context1 = React.createContext({v: 1});
    const context2 = React.createContext("42");

    const Gearbox = gearbox({
      //context0: <context1.Consumer children={null}/>,
      context1: <context1.Consumer children={null}/>,
      context2: () => <context2.Consumer children={null}/>,
    });

    const InnerComponent = () => (
      <Gearbox.train>
        {({context1, context2}) => <span>{context1.v} + {context2}</span>}
      </Gearbox.train>
    )

    const testRenderer = TestRenderer.create(
      <Gearbox>
        <div>
          <InnerComponent/>
        </div>
      </Gearbox>
    );

    expect(testRenderer.root.findByType('span').children).toEqual(["1", " + ", "42"]);
  });

  it('transmition', () => {
    const context1 = React.createContext({v: 1});
    const context2 = React.createContext("42");

    const Gearbox = gearbox({
      context1: <context1.Consumer children={null}/>,
      context2: () => <context2.Consumer children={null}/>,
    });

    const Ungear = transmition(Gearbox, ({context1, context2}) => ({sum: (+context1) + (+context2.v)}));

    const InnerComponent = () => (
      <Ungear render>
        {({sum}) => (
          <Gearbox.train>
            {({context1, context2}) => <span>{context1} + {context2.v} + {sum}</span>}
          </Gearbox.train>
        )}
      </Ungear>
    )

    const testRenderer = TestRenderer.create(
      <Gearbox>
        <Gearbox.transmission clutch={({context1, context2}) => ({context1: context2, context2: context1})}>
          <div>
            <InnerComponent/>
          </div>
        </Gearbox.transmission>
      </Gearbox>
    );

    expect(testRenderer.root.findByType('span').children).toEqual(["42", " + ", "1", " + ", "43"]);
  });

  it('state change', () => {
    const Gearbox = gearbox({
      v1: <Value initial={0}/>,
      v2: ({v2}: { v2: number }) => <Value initial={v2}/>,
      v3: <Value initial={2}/>,
    });

    let spyV1;
    let spyV2;
    let spyV3;

    const store = (v1,v2,v3) => {
      spyV1=v1;
      spyV2=v2;
      spyV3=v3;
      return "spy";
    };

    const testRenderer = TestRenderer.create(
      <Gearbox render v2={1}>
        {({v1, v2, v3}) =>
          <div>
            {store(v1, v2, v3)}
            <span>{v1.value} + {v2.value} + {v3.value}</span>
          </div>
        }
      </Gearbox>
    );

    expect(testRenderer.root.findByType('span').children).toEqual(["0", " + ", "1", " + ", "2"]);

    spyV1.set('!');

    expect(testRenderer.root.findByType('span').children).toEqual(["!", " + ", "1", " + ", "2"]);

    spyV1.set('*');
    spyV3.set('^');

    expect(testRenderer.root.findByType('span').children).toEqual(["*", " + ", "1", " + ", "^"]);

    spyV2.set('_');

    expect(testRenderer.root.findByType('span').children).toEqual(["*", " + ", "_", " + ", "^"]);

  })
});
