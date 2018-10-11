import * as React from 'react';
import {Value, Toggle} from 'react-powerplug'
import {gear, gearbox, setGearboxDebug, transmission} from "../src";

const np = () => null;

const St = gearbox({
  v1: <Value initial={10} children={np}/>,
  v2: ({v}: { v: number }) => <Value initial={v} children={np}/>,
  v3: <Value initial={20} children={np}/>
}, { pure: true });

class Blocker extends React.Component {
  shouldComponentUpdate() {
    return false;
  }

  componentWillUnmount() {
    console.log('UNMOUNT');
  }

  render() {
    return this.props.children;
  }
}

const Sub = () => (
    <div style={{border: '1px solid #000'}}>
      <St.train>
        {({v1, v2, v3}) => (
          <div> train :
            ST:{v1.value}-{v2.value}-{v3.value}
          </div>
        )}
      </St.train>
      <St.train>
        {({v1}) => (
          <div> train :
            1:{v1.value}
            <Blocker>
              **{v1.value}
            </Blocker>
          </div>
        )}
      </St.train>
      <St.train>
        {({v2,}) => (
          <div> train :
            2:{v2.value}
          </div>
        )}
      </St.train>
      <St.train>
        {({v3}) => (
          <div> train :
            3:{v3.value}
          </div>
        )}
      </St.train>
    </div>
);

const Transformer: React.SFC = ({children}) => (
  <St.transmission clutch={({v1, v2, v3}) => ({v3: v1, v2, v1: v3})}>
    <div>{children}</div>
  </St.transmission>
)

const SubSt = transmission(St, ({v1, v2, v3}) => ({sum: v1.value + v2.value + v3.value}))

const AddGear = gearbox({
  v0: <Value initial={1} children={np}/>,
  v1: <Value initial={1} children={np}/>,
  v2: <Value initial={1} children={np}/>,
}, {
  transmission: ({v1, v2}: { v1: any, v2: any }) => ({sum: v1.value + v2.value})
})

const YGearbox = gearbox({
  v1: <Value initial={0} children={np}/>,
});

const XGearbox = gearbox({
  v1: <Value initial={0} children={np}/>,
}, {
  transmission: ({v1}: { v1: any }, {added}: { added: number }) => ({
    v1,
    added: added + v1.value
  })
});

const AddGearS = gearbox({
  v1: <Value initial={1} children={np}/>,
  v2: <Value initial={1} children={np}/>,
}, {
  transmission: ({v1, v2}: { v1: any, v2: any }, {add}: { add: number }) => ({sum: v1.value + v2.value + add})
});

const Switch = gearbox({
  toggle: ({initial}: { initial: boolean }) => <Toggle initial={initial} children={np}/>,
}, {
  defaultProps: {
    render: true
  },
  transmission: ({toggle}: { toggle: { on: boolean, toggle: () => void } }) => ({
    enabled: toggle.on,
    switchIt: toggle.toggle
  })
});

const PropAffected = gearbox({
  value: <Value initial={0} children={np}/>,
}, {
  defaultProps: {
    render: true
  },
  transmission: (
    {value}: { value: { value: number, set: (a: number) => void } },
    {addedValue}: { addedValue: number }
  ) => ({
    v: value.value + addedValue,
    s: value.set
  })
});

const YYGearbox = gearbox({
  v1: gear(Value, {initial: 0})
});

const App = () => (
  <div>

    <YYGearbox render>
      {({v1}) => <div>{v1.value}</div>}
    </YYGearbox>


    <AddGear render>
      {({sum}) => <span>should be 2 = {sum}</span>}
    </AddGear>

    <AddGear>
      <span>should be 2 = {1}</span>
    </AddGear>

    <Switch initial={true} render={true}>
      {({enabled}) => <div> toggled(Y) {enabled ? "Y" : "N"} </div>}
    </Switch>


    <AddGearS render add={1}>
      {({sum}) => <span>should be 3 = {sum}</span>}
    </AddGearS>


    <YGearbox render>
      {({v1}) => <div>{v1.value}</div>}
    </YGearbox>

    <XGearbox added={42}>
      <div></div>
    </XGearbox>

    <Value initial={99}>
      {(v0) => (
        <div>
          {v0.value}!!
          <St render v={42} name="St">
            {({v1, v2, v3}) => (
              <span>
                <button onClick={() => v0.set(v0.value + 1)}>b0</button>
                ST:{v0.value}-{v1.value}-{v2.value}-{v3.value}
                <button onClick={() => v1.set(v1.value + 1)}>b1</button>
                <button onClick={() => v2.set(v2.value + 1)}>b2</button>
                <button onClick={() => v3.set(v3.value + 1)}>b3</button>

                <PropAffected addedValue={v3.value} render={true}>
                  {({v, s}) => (
                    <div>
                      <span>added value = {v} ({v3.value})</span>
                      <button onClick={() => s(v + 1 - v3.value)}>b3</button>
                    </div>
                  )}
                </PropAffected>

                <Blocker>
                  <Sub/>

                  <Transformer>
                    <Sub/>
                  </Transformer>
                </Blocker>
                <SubSt>
                  <div>
                    Sum:

                    <SubSt.train>
                      {({sum}) => <span>{sum}</span>}
                    </SubSt.train>
                  </div>
                </SubSt>
              </span>

            )}
          </St>
          +
        </div>
      )}
    </Value>
  </div>
);

setGearboxDebug(true);

export default App;