export const BOATS = [
  {id:"mochi",name:"Mochi Dart",driver:"Mochi",color:"#ff87b3",accent:"#fff7d8",helmet:"#fdf4fa",stats:{maxSpeed:40,accel:18,handling:1.08,boostPower:1}},
  {id:"kopi",name:"Kopi Cruiser",driver:"Kopi",color:"#da8646",accent:"#6a4038",helmet:"#b58458",stats:{maxSpeed:45,accel:14,handling:.82,boostPower:.88}},
  {id:"bubble",name:"Bubble Bee",driver:"Bubble",color:"#ffcf49",accent:"#343e58",helmet:"#ffdf7d",stats:{maxSpeed:37,accel:21,handling:1.34,boostPower:.93}},
  {id:"pudding",name:"Rocket Pudding",driver:"Pudding",color:"#fa595c",accent:"#ffedd4",helmet:"#f6b76b",stats:{maxSpeed:38,accel:16,handling:.84,boostPower:1.55}}
];
export const TRACKS = [
 {id:"sunny",name:"Sunny Cove",subtitle:"A tropical rollercoaster",level:1,unlock:0,width:25,
  sky:"#a5e1df",fog:"#9fdadc",water:"#43bbce",ground:"#8cbd85",accent:"#f9c777",
  points:[[-12,0],[30,80],[118,130],[196,112],[250,42],[214,-46],[135,-105],[58,-168],[-38,-174],[-126,-116],[-172,-37],[-133,47],[-74,84]],
  ramps:[.18,.58],pickups:[.08,.14,.24,.33,.41,.53,.64,.73,.83,.93],
  rocks:[.11,.38,.69],logs:[.27,.77],whirlpools:[.48],shortcuts:[]},
 {id:"canyon",name:"Lantern Canyon",subtitle:"Sunset tunnel sprint",level:2,unlock:1,width:21,
  sky:"#f7a3a1",fog:"#edb39a",water:"#d78e85",ground:"#bb8968",accent:"#ffd58d",
  points:[[0,0],[80,75],[165,52],[215,-19],[170,-109],[65,-129],[-38,-102],[-145,-151],[-190,-72],[-125,15]],
  ramps:[.31,.85],pickups:[.08,.17,.29,.39,.51,.63,.72,.84,.94],
  rocks:[.23,.48],logs:[.13],whirlpools:[.35],barrels:[.66,.82],
  shortcuts:[{from:.57,to:.77,entryLane:.33,exitLane:.1,width:13,kind:"cave",bend:-7,hazardT:.73}]},
 {id:"frost",name:"Frostbite Falls",subtitle:"Ice, spray and a giant leap",level:3,unlock:2,width:22,
  sky:"#babbdc",fog:"#c2d4df",water:"#82bad9",ground:"#cde5e9",accent:"#f2f8fa",
  points:[[0,0],[90,85],[195,80],[260,-10],[213,-90],[140,-116],[62,-84],[30,-15],[-28,8],[-62,-80],[-86,-155],[-175,-135],[-215,-35],[-130,65]],
  ramps:[.23,.58],pickups:[.06,.19,.3,.42,.53,.64,.76,.88],
  rocks:[.15,.34,.7],logs:[.53],ice:[.08,.38,.78],whirlpools:[.84],
  shortcuts:[{from:.42,to:.67,entryLane:-.32,exitLane:-.1,width:15,kind:"waterfall",bend:6,jumpAt:.4,hazardT:.82}]}
];
export const SAVE_KEY="mycozyworld_cozy_rapids_v1";
export const DIFFICULTIES={easy:{aiSpeed:.91,rubber:.16,mistake:.55},normal:{aiSpeed:1,rubber:.11,mistake:.38},hard:{aiSpeed:1.08,rubber:.07,mistake:.22}};
export const LAPS=3;
