import * as React from 'react';
import {Value, Toggle} from 'react-powerplug'
import {gearbox, setGearboxDebug, transmission} from "../src";

const St = gearbox({
  v1: <Value initial={10}/>,
  v2: ({v}: { v: number }) => <Value initial={v}/>,
  v3: <Value initial={20}/>
});

const Sub = () => (
  <St.train>
    {({v1, v2, v3}) => (
      <div> train :
        ST:{v1.value}-{v2.value}-{v3.value}
      </div>
    )}
  </St.train>
);

const Transformer: React.SFC = ({children}) => (
  <St.transmission clutch={({v1, v2, v3}) => ({v3: v1, v2, v1: v3})}>
    <div>{children}</div>
  </St.transmission>
)

const SubSt = transmission(St, ({v1, v2, v3}) => ({sum: v1.value + v2.value + v3.value}))

const AddGear = gearbox({
  v0: <Value initial={1}/>,
  v1: <Value initial={1}/>,
  v2: <Value initial={1}/>,
}, {
  transmission: ({v1, v2}: { v1: any, v2: any }) => ({sum: v1.value + v2.value})
})

const YGearbox = gearbox({
  v1: <Value initial={0}/>,
});

const XGearbox = gearbox({
  v1: <Value initial={0}/>,
}, {
  transmission: ({v1}: { v1: any }, {added}: { added: number }) => ({
    v1,
    added: added + v1.value
  })
});

const AddGearS = gearbox({
  v1: <Value initial={1}/>,
  v2: <Value initial={1}/>,
}, {
  transmission: ({v1, v2}: { v1: any, v2: any }, {add}: { add: number }) => ({sum: v1.value + v2.value + add})
});

const Switch = gearbox({
  toggle: ({initial}: { initial: boolean }) => <Toggle initial={initial}/>,
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
  value: <Value initial={0}/>,
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

const App = () => (
  <div>
    <AddGear render>
      {({sum}) => <span>should be 2 = {sum}</span>}
    </AddGear>

    <Switch initial={true}>
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

                <PropAffected addedValue={v3.value}>
                  {({v, s}) => (
                    <div>
                      <span>added value = {v} ({v3.value})</span>
                      <button onClick={() => s(v + 1 - v3.value)}>b3</button>
                    </div>
                  )}
                </PropAffected>

                <Sub/>

                <Transformer>
                  <Sub/>
                </Transformer>
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