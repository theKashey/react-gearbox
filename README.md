⚙️ GearBox ⚙️
=======

[![Greenkeeper badge](https://badges.greenkeeper.io/theKashey/react-gearbox.svg)](https://greenkeeper.io/)

Compose renderless containers like a pro. 
Heavily inspired by [react-adopt](https://github.com/pedronauck/react-adopt)(context compose),
 [react-powerplug](https://github.com/renatorib/react-powerplug)(renderless containers)
 and [redux-restate](https://github.com/theKashey/restate)(fractal state).

# API

* `gearbox(gears): Gearbox` - creates a Gearbox component. Where `gears` is a set of ReactElements of FunctionalStatelessComponents.

Produces a `Gearbox` - renderless container, which will provide _torque_ from all gears as a render prop.

* `transmission(gearboxIn, clutch): Gearbox` - created a devired Gearbox, with "clutch" function applied to all stored data. 

`Gearbox` is a compound component, and includes 2 sub components
* Gearbox.train - _React Context_ based long-range torque provider, which will provide access to the parent Gearbox from the nested components.
* Gearbox.transmission - establish a local (declarative) transmition. Might not be type safe.

`Gearbox` has only one prop - `render`, if not set - children is a ReactNode. If set - renderProp(function as a children)
 
## Rules
 - `Gearboxes` are used to combine gears together, and put them into context.
 - `trains` - to access distant gearbox.
 - `transmission` - to adapt data structure for the local needs.
 
# Examples

1. Create a gearbox  
```js
 import {gearbox} from 'react-gearbox';
 import {Value, Toggle} from 'react-powerplug';
 
 
 const Gearbox = gearbox({
   storedValue: <Value initial = {42} />,
   toggle: props => <Toggle initial={props.on} />,
   data: reactContext.Consumer,
   stated: <UnstatedContainer />,
 }); 
```

2. Use Gearbox with or without renderprops 
 ```js
 const App = () => (
     <Gearbox on render>
        {({storedValue, toggle, data, stated}) => <div>...</div>}
     </Gearbox>
 )
 
 const App = () => (
      <Gearbox on>
         <div>...</div>
      </Gearbox>
  )
 ```
3. Use Gearbox.train to get the data
```js 
 // once Gearbox is assembled - you can access it elsewhere using gear trains
 
 const Children = () => (
      <Gearbox.train>
         {({storedValue, toggle, data, stated}) => <div>...</div>}
      </Gearbox>
  )
```

4. Use Gearbox.transmission to adopt the data   
```js  
 // component based Transmission are NOT type safe
 const Transmission = () => (
     <Gearbox.transmission 
       clutch={({toggle, data}) => ({on:toggle.on, toggle: data.toggle})}
     >
         <Gearbox.train> {/* you may use <Gearbox.train_untyped> */ }
             {({on, toggle}) => <div>...</div>}
         </Gearbox.train>
     </Gearbox.transmission>
 )
 
const Transmission = () => (
     <Gearbox.transmission 
       clutch={({toggle, data}) => ({on:toggle.on, toggle: data.toggle})}
       render /* use as render prop */
     >         
             {({on, toggle}) => <div>...</div>}
     </Gearbox.transmission>
 )
```

4. Use transmission to achive type safe transmission.
```js
const TransmittedGear = transmission(Gearbox, ({toggle, data}) => ({on:toggle.on, toggle: data.toggle}));
```
  
# Licence
 MIT
  
