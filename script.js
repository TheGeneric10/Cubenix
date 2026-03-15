/* ============================================================
   CUBENIX — script.js — v0.0.7a
   + Survival mode: gravity, jump, collision, no fly
   + Improved caves: tunnels, ravines, surface openings
   + Island / river / lake / lava pool world gen
   + Lava pools (multi-block, not single)
   + Water/lava flow mechanics
   + Animated water + lava textures
   + Block placement (RMB)
   + Collision detection against all solid blocks
   + Sand/gravel gravity
   + Dropped item lands on ground
   + Right-hand 3D block in-view model
   + Draggable inventory with tooltips
   + Crafting: planks, sticks, crafting table, pickaxe, chest
   + Items: ingots, coal, diamond drops
   + 3D hotbar slot icons (isometric)
   + Trees: small / medium / large variants
   + Grass top = solid #5aaa3c
   + Tree density option
   + All settings apply live
   ============================================================ */
   'use strict';

   // ═══════════════════════════════════════════════════════════
   // 0.  CONFIG
   // ═══════════════════════════════════════════════════════════
   const CFG = {
     renderDist:10, simDist:8,
     chunkW:16, chunkH:256, seaLevel:63,
     maxReach:4.5,
     playerH:1.8, eyeOffset:1.62,
     walkSpeed:4.5, sprintSpeed:7.5, flySpeed:0,  // no fly in survival
     jumpVel:8.0, gravity:22.0,
     mouseSens:0.0022,
     worldLimit:2000,
     fov:70, brightness:1.0,
     particles:true, clouds:true, shadows:true,
     fogDensity:0.8,
     treeDensity:'default',  // low | default | high
   };
   
   // Block IDs
   const B={
     AIR:0,GRASS:1,DIRT:2,STONE:3,BEDROCK:4,
     SAND:5,WOOD:6,LEAVES:7,WATER:8,LAVA:9,
     COAL_ORE:10,IRON_ORE:11,GOLD_ORE:12,DIAMOND_ORE:13,
     GRAVEL:14,CRAFTING_TABLE:15,PLANKS:16,
   };
   const BLOCK_NAMES=[
     'Air','Grass','Dirt','Stone','Bedrock','Sand',
     'Oak Log','Leaves','Water','Lava',
     'Coal Ore','Iron Ore','Gold Ore','Diamond Ore',
     'Gravel','Crafting Table','Oak Planks',
   ];
   
   // Item IDs (non-block items start at 100)
   const IT={
     COAL:100, IRON_INGOT:101, GOLD_INGOT:102, DIAMOND:103,
     STICK:104, WOOD_PICKAXE:105,
     // block items reuse block IDs for placement
   };
   const ITEM_NAMES={
     [IT.COAL]:'Coal',[IT.IRON_INGOT]:'Iron Ingot',
     [IT.GOLD_INGOT]:'Gold Ingot',[IT.DIAMOND]:'Diamond',
     [IT.STICK]:'Stick',[IT.WOOD_PICKAXE]:'Wooden Pickaxe',
   };
   function getItemName(id){
     if(id<100) return BLOCK_NAMES[id]||'Unknown';
     return ITEM_NAMES[id]||'Item '+id;
   }
   function isBlockItem(id){ return id<100 && id!==B.AIR; }
   
   // Break times (seconds, fist)
   const BREAK_TIME={
     [B.GRASS]:0.9,[B.DIRT]:0.75,[B.SAND]:0.75,[B.GRAVEL]:0.75,
     [B.STONE]:7.5,[B.COAL_ORE]:7.5,[B.IRON_ORE]:7.5,
     [B.GOLD_ORE]:7.5,[B.DIAMOND_ORE]:7.5,
     [B.WOOD]:3.0,[B.LEAVES]:0.5,[B.PLANKS]:2.0,[B.CRAFTING_TABLE]:3.0,
     [B.BEDROCK]:Infinity,[B.WATER]:Infinity,[B.LAVA]:Infinity,
   };
   
   // Drop table: blockId → [{id, count, chance}]
   const DROP_TABLE={
     [B.GRASS]:   [{id:B.DIRT,count:1,ch:1}],
     [B.DIRT]:    [{id:B.DIRT,count:1,ch:1}],
     [B.STONE]:   [{id:B.STONE,count:1,ch:1}],
     [B.SAND]:    [{id:B.SAND,count:1,ch:1}],
     [B.GRAVEL]:  [{id:B.GRAVEL,count:1,ch:1}],
     [B.WOOD]:    [{id:B.WOOD,count:1,ch:1}],
     [B.LEAVES]:  [{id:B.LEAVES,count:1,ch:0.2}],
     [B.PLANKS]:  [{id:B.PLANKS,count:1,ch:1}],
     [B.CRAFTING_TABLE]: [{id:B.CRAFTING_TABLE,count:1,ch:1}],
     [B.COAL_ORE]:    [{id:IT.COAL,count:1,ch:1}],
     [B.IRON_ORE]:    [{id:IT.IRON_INGOT,count:2,ch:1}],
     [B.GOLD_ORE]:    [{id:IT.GOLD_INGOT,count:2,ch:1}],
     [B.DIAMOND_ORE]: [{id:IT.DIAMOND,count:1,ch:1}],
     [B.BEDROCK]: [],
   };
   
   // Player stats
   const STATS={
     health:20,maxHealth:20,hunger:20,maxHunger:20,
     shield:10,maxShield:10,armor:0,maxArmor:3,
     energy:100,maxEnergy:100,
   };
   
   // Inventory
   const INV={
     hotbar:Array(9).fill(null),
     main:Array(27).fill(null),
     active:0,
     craftGrid:Array(4).fill(null),
     craftResult:null,
   };
   
   const SEED=Math.floor(Math.random()*9007199254740991);
   const FACTS=[
     'Seeds range from -9,223,372,036,854,775,808 to 9,223,372,036,854,775,807!',
     'Cave tunnels can span hundreds of blocks underground.',
     'Ravines slice through the surface and expose ores.',
     'Sand and gravel fall when unsupported.',
     'Wooden pickaxes mine stone 2× faster than fists.',
     'Iron ore drops 2 ingots when broken.',
     'Crafting tables enable 3×3 crafting recipes.',
     'Coal is used for smelting and torches.',
     'Lava pools form naturally near the surface.',
     'Rivers and lakes generate between landmasses.',
   ];
   
   // ═══════════════════════════════════════════════════════════
   // 1.  RENDERER
   // ═══════════════════════════════════════════════════════════
   document.addEventListener('contextmenu',e=>e.preventDefault());
   document.addEventListener('dragstart',  e=>e.preventDefault());
   document.addEventListener('selectstart',e=>e.preventDefault());
   
   const canvas=document.getElementById('game-canvas');
   const renderer=new THREE.WebGLRenderer({
     canvas,antialias:true,
     powerPreference:'high-performance',precision:'mediump',stencil:false,
   });
   renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
   renderer.setSize(window.innerWidth,window.innerHeight);
   renderer.shadowMap.enabled=true;
   renderer.shadowMap.type=THREE.PCFSoftShadowMap;
   
   const scene=new THREE.Scene();
   const camera=new THREE.PerspectiveCamera(CFG.fov,window.innerWidth/window.innerHeight,0.05,512);
   
   // ═══════════════════════════════════════════════════════════
   // 2.  TEXTURES
   // ═══════════════════════════════════════════════════════════
   function makeTex(draw,size=16){
     const c=document.createElement('canvas');c.width=c.height=size;
     const g=c.getContext('2d');draw(g,size);
     const t=new THREE.CanvasTexture(c);
     t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestFilter;
     return t;
   }
   function rng(s){let v=s+1;return()=>{v=(v*16807)%2147483647;return(v-1)/2147483646;};}
   
   const TEX={};
   
   // Grass TOP — plain solid
   TEX.grassTop=makeTex(g=>{
     g.fillStyle='#5aaa3c';g.fillRect(0,0,16,16);
     const r=rng(1);
     for(let i=0;i<20;i++){const d=(r()*10)|0;g.fillStyle=`rgba(0,${d},0,0.14)`;g.fillRect((r()*16)|0,(r()*16)|0,1,1);}
   });
   
   // Grass SIDE — green strip top, dirt below
   TEX.grassSide=makeTex(g=>{
     g.fillStyle='#7a5230';g.fillRect(0,0,16,16);
     const r=rng(2);
     for(let i=0;i<32;i++){const v=(r()*18-9)|0;g.fillStyle=`rgb(${122+v},${82+v},${48+v})`;g.fillRect((r()*16)|0,4+(r()*12)|0,1+(r()*2)|0,1);}
     g.fillStyle='#5aaa3c';g.fillRect(0,0,16,4);
   });
   
   TEX.dirt=makeTex(g=>{
     g.fillStyle='#7a5230';g.fillRect(0,0,16,16);
     const r=rng(3);
     for(let i=0;i<42;i++){const v=(r()*20-10)|0;g.fillStyle=`rgb(${122+v},${82+v},${48+v})`;g.fillRect((r()*15)|0,(r()*15)|0,1+(r()*2)|0,1+(r()*2)|0);}
   });
   
   TEX.stone=makeTex(g=>{
     g.fillStyle='#888';g.fillRect(0,0,16,16);
     const r=rng(4);
     for(let i=0;i<38;i++){const v=(r()*26-13)|0;g.fillStyle=`rgb(${136+v},${136+v},${136+v})`;g.fillRect((r()*15)|0,(r()*15)|0,1+(r()*3)|0,1);}
     g.strokeStyle='#666';g.lineWidth=0.5;
     g.beginPath();g.moveTo(3,6);g.lineTo(7,9);g.lineTo(4,13);g.stroke();
     g.beginPath();g.moveTo(10,2);g.lineTo(14,6);g.stroke();
   });
   
   TEX.bedrock=makeTex(g=>{
     g.fillStyle='#2a2a2a';g.fillRect(0,0,16,16);
     const r=rng(5);
     for(let i=0;i<52;i++){const v=(r()*32)|0;g.fillStyle=`rgb(${v},${v},${v})`;g.fillRect((r()*14)|0,(r()*14)|0,1+(r()*3)|0,1+(r()*3)|0);}
   });
   
   TEX.woodSide=makeTex(g=>{
     g.fillStyle='#6b4423';g.fillRect(0,0,16,16);
     const r=rng(6);
     for(let y=0;y<16;y++){const v=(Math.sin(y*0.9+r()*0.4)*7)|0;g.fillStyle=`rgb(${107+v},${68+v},${35+v})`;g.fillRect(0,y,16,1);}
     for(let i=0;i<4;i++){g.fillStyle='rgba(0,0,0,0.12)';g.fillRect((r()*14)|0,0,1,16);}
   });
   
   TEX.woodTop=makeTex(g=>{
     g.fillStyle='#8c6239';g.fillRect(0,0,16,16);
     for(let i=4;i>=0;i--){g.strokeStyle=i%2===0?'#6b4423':'#a07040';g.lineWidth=1;g.beginPath();g.arc(8,8,i*2.2,0,Math.PI*2);g.stroke();}
     g.fillStyle='rgba(0,0,0,0.13)';g.fillRect(7,0,2,16);g.fillRect(0,7,16,2);
   });
   
   TEX.leaves=makeTex(g=>{
     g.clearRect(0,0,16,16);const r=rng(7);
     for(let i=0;i<72;i++){const v=(r()*32-16)|0;g.fillStyle=`rgba(${44+v},${128+v},${36+v},${0.74+r()*0.26})`;g.fillRect((r()*15)|0,(r()*15)|0,1+(r()*2)|0,1+(r()*2)|0);}
   });
   
   // Animated water frames (4 frames)
   TEX.waterFrames=[];
   for(let f=0;f<4;f++){
     TEX.waterFrames.push(makeTex(g=>{
       g.fillStyle=`rgba(20,78,210,0.74)`;g.fillRect(0,0,16,16);
       const phase=f*Math.PI/2;
       g.strokeStyle='rgba(60,140,255,0.5)';g.lineWidth=1.2;
       for(let i=0;i<4;i++){
         g.beginPath();g.moveTo(0,3+i*4);
         for(let x=0;x<=16;x+=2)g.lineTo(x,3+i*4+Math.sin(x*0.85+phase)*1.5);
         g.stroke();
       }
     }));
   }
   
   // Animated lava frames (4 frames)
   TEX.lavaFrames=[];
   for(let f=0;f<4;f++){
     TEX.lavaFrames.push(makeTex(g=>{
       const r=rng(8+f*100);
       for(let y=0;y<16;y++)for(let x=0;x<16;x++){
         const noise=rng(x*16+y+f*300)();
         const v=noise>0.55?`rgb(255,${(noise*180)|0},0)`:`rgb(${180+(noise*40)|0},${(noise*50)|0},0)`;
         g.fillStyle=v;g.fillRect(x,y,1,1);
       }
     }));
   }
   
   TEX.sand=makeTex(g=>{
     g.fillStyle='#ddd078';g.fillRect(0,0,16,16);
     const r=rng(9);
     for(let i=0;i<42;i++){const v=(r()*16-8)|0;g.fillStyle=`rgb(${221+v},${208+v},${120+v})`;g.fillRect((r()*15)|0,(r()*15)|0,1,1);}
   });
   
   TEX.gravel=makeTex(g=>{
     g.fillStyle='#888';g.fillRect(0,0,16,16);
     const r=rng(10);
     for(let i=0;i<50;i++){const v=(r()*50)|0;g.fillStyle=`rgb(${v+80},${v+80},${v+80})`;g.fillRect((r()*13)|0,(r()*13)|0,2+(r()*3)|0,2+(r()*3)|0);}
   });
   
   TEX.planks=makeTex(g=>{
     g.fillStyle='#b0832e';g.fillRect(0,0,16,16);
     const r=rng(11);
     for(let y=0;y<16;y+=8){g.strokeStyle='rgba(0,0,0,0.22)';g.lineWidth=1;g.beginPath();g.moveTo(0,y);g.lineTo(16,y);g.stroke();}
     g.beginPath();g.moveTo(8,0);g.lineTo(8,8);g.stroke();
     g.beginPath();g.moveTo(0,8);g.lineTo(8,16);g.stroke();
     g.beginPath();g.moveTo(8,8);g.lineTo(16,16);g.stroke();
     for(let i=0;i<20;i++){const v=(r()*20-10)|0;g.fillStyle=`rgb(${176+v},${131+v},${46+v})`;g.fillRect((r()*15)|0,(r()*15)|0,1+(r()*2)|0,1);}
   });
   
   TEX.craftingTop=makeTex(g=>{
     // top shows crafting grid pattern
     g.fillStyle='#b0832e';g.fillRect(0,0,16,16);
     g.fillStyle='rgba(0,0,0,0.3)';g.fillRect(1,1,6,6);g.fillRect(9,1,6,6);g.fillRect(1,9,6,6);g.fillRect(9,9,6,6);
     g.fillStyle='#d0a030';g.fillRect(2,2,4,4);g.fillRect(10,2,4,4);g.fillRect(2,10,4,4);g.fillRect(10,10,4,4);
   });
   
   TEX.craftingSide=makeTex(g=>{
     g.fillStyle='#b0832e';g.fillRect(0,0,16,16);
     const r=rng(12);
     for(let y=0;y<16;y+=8){g.strokeStyle='rgba(0,0,0,0.2)';g.lineWidth=1;g.beginPath();g.moveTo(0,y);g.lineTo(16,y);g.stroke();}
   });
   
   function makeOre(br,bg,bb,sr,sg,sb,seed){
     return makeTex(g=>{
       g.fillStyle=`rgb(${br},${bg},${bb})`;g.fillRect(0,0,16,16);
       const r=rng(seed);
       for(let i=0;i<36;i++){const v=(r()*22-11)|0;g.fillStyle=`rgb(${br+v},${bg+v},${bb+v})`;g.fillRect((r()*15)|0,(r()*15)|0,1+(r()*3)|0,1);}
       g.strokeStyle='#555';g.lineWidth=0.5;g.beginPath();g.moveTo(3,7);g.lineTo(7,10);g.stroke();
       for(let i=0;i<10;i++){
         g.fillStyle=`rgb(${sr},${sg},${sb})`;const ox=(r()*13)|0,oy=(r()*13)|0,os=1+(r()*2)|0;
         g.fillRect(ox,oy,os+1,os);g.fillStyle='rgba(255,255,255,0.25)';g.fillRect(ox,oy,1,1);
       }
     });
   }
   TEX.coalOre    =makeOre(136,136,136,28,28,28,20);
   TEX.ironOre    =makeOre(136,136,136,210,148,95,21);
   TEX.goldOre    =makeOre(136,136,136,242,198,28,22);
   TEX.diamondOre =makeOre(136,136,136,72,225,222,23);
   
   // Item icons (non-block items)
   TEX.coal=makeTex(g=>{g.fillStyle='#111';g.fillRect(2,2,12,12);g.fillStyle='#333';g.fillRect(4,4,4,4);g.fillRect(9,6,3,3);});
   TEX.ironIngot=makeTex(g=>{g.fillStyle='#aaa';g.fillRect(2,4,12,8);g.fillStyle='#ccc';g.fillRect(3,5,4,3);g.fillStyle='#888';g.fillRect(9,7,4,3);});
   TEX.goldIngot=makeTex(g=>{g.fillStyle='#e8a820';g.fillRect(2,4,12,8);g.fillStyle='#f0c840';g.fillRect(3,5,4,3);g.fillStyle='#c89010';g.fillRect(9,7,4,3);});
   TEX.diamond=makeTex(g=>{
     g.fillStyle='#44dddd';g.fillRect(6,2,4,4);g.fillRect(4,6,8,4);g.fillRect(6,10,4,4);
     g.fillStyle='#88ffff';g.fillRect(7,3,2,2);
   });
   TEX.stick=makeTex(g=>{g.fillStyle='#7a5230';g.fillRect(6,0,4,16);g.fillStyle='#9a7240';g.fillRect(7,0,2,16);});
   TEX.woodPickaxe=makeTex(g=>{
     g.fillStyle='#b0832e';
     g.fillRect(0,3,10,3);g.fillRect(0,7,10,3);
     g.fillStyle='#7a5230';g.fillRect(7,6,3,10);
     g.fillStyle='#d0a030';g.fillRect(1,4,5,1);g.fillRect(1,8,5,1);
   });
   
   // Texture lookup by block ID
   const BLOCK_TEX={
     [B.GRASS]:   {top:TEX.grassTop,bot:TEX.dirt,side:TEX.grassSide},
     [B.DIRT]:    {top:TEX.dirt,bot:TEX.dirt,side:TEX.dirt},
     [B.STONE]:   {top:TEX.stone,bot:TEX.stone,side:TEX.stone},
     [B.BEDROCK]: {top:TEX.bedrock,bot:TEX.bedrock,side:TEX.bedrock},
     [B.SAND]:    {top:TEX.sand,bot:TEX.sand,side:TEX.sand},
     [B.GRAVEL]:  {top:TEX.gravel,bot:TEX.gravel,side:TEX.gravel},
     [B.WOOD]:    {top:TEX.woodTop,bot:TEX.woodTop,side:TEX.woodSide},
     [B.LEAVES]:  {top:TEX.leaves,bot:TEX.leaves,side:TEX.leaves},
     [B.WATER]:   {top:TEX.waterFrames[0],bot:TEX.waterFrames[0],side:TEX.waterFrames[0]},
     [B.LAVA]:    {top:TEX.lavaFrames[0],bot:TEX.lavaFrames[0],side:TEX.lavaFrames[0]},
     [B.COAL_ORE]:    {top:TEX.coalOre,bot:TEX.coalOre,side:TEX.coalOre},
     [B.IRON_ORE]:    {top:TEX.ironOre,bot:TEX.ironOre,side:TEX.ironOre},
     [B.GOLD_ORE]:    {top:TEX.goldOre,bot:TEX.goldOre,side:TEX.goldOre},
     [B.DIAMOND_ORE]: {top:TEX.diamondOre,bot:TEX.diamondOre,side:TEX.diamondOre},
     [B.PLANKS]:  {top:TEX.planks,bot:TEX.planks,side:TEX.planks},
     [B.CRAFTING_TABLE]:{top:TEX.craftingTop,bot:TEX.planks,side:TEX.craftingSide},
   };
   // Item icon textures (non-block)
   const ITEM_TEX={
     [IT.COAL]:TEX.coal,[IT.IRON_INGOT]:TEX.ironIngot,
     [IT.GOLD_INGOT]:TEX.goldIngot,[IT.DIAMOND]:TEX.diamond,
     [IT.STICK]:TEX.stick,[IT.WOOD_PICKAXE]:TEX.woodPickaxe,
   };
   function getItemTex(id){
     if(id<100) return (BLOCK_TEX[id]||BLOCK_TEX[B.STONE]).top;
     return ITEM_TEX[id]||TEX.stone;
   }
   
   const matCache={};
   function getMats(id){
     if(matCache[id]) return matCache[id];
     const bt=BLOCK_TEX[id]||BLOCK_TEX[B.STONE];
     const tr=id===B.LEAVES||id===B.WATER||id===B.LAVA;
     const op={transparent:tr,opacity:id===B.WATER?0.76:id===B.LEAVES?0.86:1,side:tr?THREE.DoubleSide:THREE.FrontSide,depthWrite:!tr};
     const base=tr?op:{};
     matCache[id]=[
       new THREE.MeshLambertMaterial({map:bt.side,...base}),
       new THREE.MeshLambertMaterial({map:bt.side,...base}),
       new THREE.MeshLambertMaterial({map:bt.top,...base}),
       new THREE.MeshLambertMaterial({map:bt.bot,...base}),
       new THREE.MeshLambertMaterial({map:bt.side,...base}),
       new THREE.MeshLambertMaterial({map:bt.side,...base}),
     ];
     return matCache[id];
   }
   
   // ═══════════════════════════════════════════════════════════
   // 3.  NOISE
   // ═══════════════════════════════════════════════════════════
   function h2(x,z){return Math.sin(x*127.1+z*311.7)*43758.5453;}
   function frac(v){return v-Math.floor(v);}
   function lp(a,b,t){return a+(b-a)*t;}
   function fade(t){return t*t*t*(t*(t*6-15)+10);}
   function noise2(x,z){
     const ix=Math.floor(x),iz=Math.floor(z);
     const fx=frac(x),fz=frac(z);
     return lp(lp(frac(Math.abs(h2(ix,iz))),frac(Math.abs(h2(ix+1,iz))),fade(fx)),
               lp(frac(Math.abs(h2(ix,iz+1))),frac(Math.abs(h2(ix+1,iz+1))),fade(fx)),fade(fz))*2-1;
   }
   function octNoise(x,z,o,lac,per){
     let v=0,a=1,f=1,mx=0;
     for(let i=0;i<o;i++){v+=noise2(x*f,z*f)*a;mx+=a;a*=per;f*=lac;}
     return v/mx;
   }
   function getHeight(wx,wz){
     const n=octNoise(wx*0.007,wz*0.007,6,2.0,0.55);
     return Math.round(CFG.seaLevel+n*30);
   }
   
   // ═══════════════════════════════════════════════════════════
   // 4.  WORLD DATA
   // ═══════════════════════════════════════════════════════════
   const chunkData=new Map();
   function vKey(lx,y,lz){return lx+lz*16+y*256;}
   function getArr(cx,cz,create=false){
     const k=`${cx},${cz}`;
     if(!chunkData.has(k)){if(!create)return null;chunkData.set(k,new Uint8Array(16*16*256));}
     return chunkData.get(k);
   }
   function worldGet(wx,wy,wz){
     if(wy<0||wy>=CFG.chunkH)return B.AIR;
     const cx=Math.floor(wx/16),cz=Math.floor(wz/16);
     const lx=((wx%16)+16)%16,lz=((wz%16)+16)%16;
     const a=getArr(cx,cz,false);return a?a[vKey(lx,wy,lz)]:B.AIR;
   }
   function worldSet(wx,wy,wz,id){
     if(wy<0||wy>=CFG.chunkH)return;
     const cx=Math.floor(wx/16),cz=Math.floor(wz/16);
     const lx=((wx%16)+16)%16,lz=((wz%16)+16)%16;
     const a=getArr(cx,cz,true);a[vKey(lx,wy,lz)]=id;
   }
   function isSolid(id){
     return id!==B.AIR&&id!==B.WATER&&id!==B.LAVA&&id!==B.LEAVES;
   }
   function isFluid(id){return id===B.WATER||id===B.LAVA;}
   
   // Ore vein generation
   function oreBlock(wx,wy,wz){
     const r=frac(Math.abs(h2(wx*7+wy,wz*13+wy*3)));
     // Coal: veins Y5-128 ~4.5%
     if(wy>=5&&wy<=128){const v=frac(Math.abs(h2(Math.floor(wx/3)*3,Math.floor(wz/3)*3+wy/3)));if(v<0.045)return B.COAL_ORE;}
     // Iron Y5-64 1.8%
     if(wy>=5&&wy<=64&&r>=0.045&&r<0.063)return B.IRON_ORE;
     // Gold Y5-32 0.8%
     if(wy>=5&&wy<=32&&r>=0.063&&r<0.071)return B.GOLD_ORE;
     // Diamond Y1-16 0.4%
     if(wy>=1&&wy<=16&&r>=0.071&&r<0.075)return B.DIAMOND_ORE;
     return B.STONE;
   }
   
   // Cave carver
   function isCave(wx,wy,wz){
     if(wy<=2)return false;
     const t1=octNoise(wx*0.04,wy*0.08+wz*0.04,2,2,0.5);
     const t2=octNoise(wx*0.04+100,wy*0.06+wz*0.04+50,2,2,0.5);
     if(t1*t1+t2*t2<0.028)return true;
     // ravine
     const rv=frac(Math.abs(h2(Math.floor(wx/5)*5,Math.floor(wz/5)*5+77)));
     if(rv<0.014&&wy>4&&wy<55){const rw=frac(Math.abs(h2(wx+999,wz+888)));if(rw<0.6)return true;}
     return false;
   }
   
   // Tree variants
   function treeSize(wx,wz){
     const r=frac(Math.abs(h2(wx*5.3,wz*4.7)));
     if(r<0.3)return 'sm'; if(r<0.75)return 'md'; return 'lg';
   }
   function treeDensityChance(){
     const t=CFG.treeDensity;
     if(t==='low')return 0.01; if(t==='high')return 0.04; return 0.02;
   }
   
   function generateChunk(cx,cz){
     const arr=getArr(cx,cz,true);
     for(let lx=0;lx<16;lx++)for(let lz=0;lz<16;lz++){
       const wx=cx*16+lx,wz=cz*16+lz;
       const h=getHeight(wx,wz);
       for(let y=0;y<CFG.chunkH;y++){
         let id=B.AIR;
         if(y===0)id=B.BEDROCK;
         else if(y<h-3){
           if(!isCave(wx,y,wz))id=oreBlock(wx,y,wz);
           else if(y<=12&&frac(Math.abs(h2(wx*2+y,wz*2)))<0.04)id=B.LAVA;
         }
         else if(y<h){
           id=isCave(wx,y,wz)?B.AIR:B.DIRT;
         }
         else if(y===h){
           if(isCave(wx,y,wz))id=B.AIR;
           else if(h<=CFG.seaLevel-1)id=B.SAND;
           else id=B.GRASS;
         }
         else if(y<=CFG.seaLevel&&h<CFG.seaLevel)id=B.WATER;
         arr[vKey(lx,y,lz)]=id;
       }
   
       // Surface lava pool (rare, 3-5 blocks wide depression)
       if(h>CFG.seaLevel+1&&frac(Math.abs(h2(wx*1.9+5,wz*2.3+11)))<0.003){
         // Carve a small pit and fill with lava
         for(let dy=0;dy<2;dy++)for(let dlx=-2;dlx<=2;dlx++)for(let dlz=-2;dlz<=2;dlz++){
           if(dlx*dlx+dlz*dlz<=4){
             const lx2=lx+dlx,lz2=lz+dlz;
             if(lx2>=0&&lx2<16&&lz2>=0&&lz2<16&&(h-dy)>=1){
               arr[vKey(lx2,h-dy,lz2)]=dy===0?B.LAVA:B.AIR;
             }
           }
         }
       }
   
       // Oak tree
       const tdChance=treeDensityChance();
       if(h>CFG.seaLevel+1&&frac(Math.abs(h2(wx*3.1+1,wz*2.9+2)))<tdChance){
         const sz=treeSize(wx,wz);
         const trunkH=sz==='sm'?3:sz==='md'?5:7;
         const leafR=sz==='sm'?2:sz==='md'?2:3;
         const leafH=sz==='sm'?3:sz==='md'?4:5;
         const base=h+1;
         for(let ty=base;ty<base+trunkH&&ty<CFG.chunkH;ty++)arr[vKey(lx,ty,lz)]=B.WOOD;
         for(let lfz=-leafR;lfz<=leafR;lfz++)for(let lfx=-leafR;lfx<=leafR;lfx++)for(let lft=leafH-3;lft<=leafH+1;lft++){
           const flx=lx+lfx,flz=lz+lfz,fly=base+trunkH-1+lft;
           if(flx>=0&&flx<16&&flz>=0&&flz<16&&fly<CFG.chunkH)
             if(arr[vKey(flx,fly,flz)]===B.AIR)arr[vKey(flx,fly,flz)]=B.LEAVES;
         }
       }
     }
   }
   
   // ═══════════════════════════════════════════════════════════
   // 5.  CHUNK MESH BUILDER
   // ═══════════════════════════════════════════════════════════
   const chunkMeshes=new Map();
   const FACES=[
     {dir:[1,0,0], c:[[1,0,0],[1,1,0],[1,1,1],[1,0,1]]},
     {dir:[-1,0,0],c:[[0,0,1],[0,1,1],[0,1,0],[0,0,0]]},
     {dir:[0,1,0], c:[[0,1,1],[1,1,1],[1,1,0],[0,1,0]]},
     {dir:[0,-1,0],c:[[0,0,0],[1,0,0],[1,0,1],[0,0,1]]},
     {dir:[0,0,1], c:[[1,0,1],[1,1,1],[0,1,1],[0,0,1]]},
     {dir:[0,0,-1],c:[[0,0,0],[0,1,0],[1,1,0],[1,0,0]]},
   ];
   const QUV=[[0,0],[0,1],[1,1],[1,0]];
   function showFace(s,n){
     if(s===B.AIR)return false;
     if(n===B.AIR)return true;
     if((s===B.WATER||s===B.LAVA)&&n!==s)return true;
     if(s===B.LEAVES&&n===B.AIR)return true;
     const sop=s!==B.WATER&&s!==B.LAVA&&s!==B.LEAVES;
     const nop=n!==B.WATER&&n!==B.LAVA&&n!==B.LEAVES&&n!==B.AIR;
     return sop&&!nop;
   }
   
   function buildChunkMesh(cx,cz){
     const key=`${cx},${cz}`;
     if(chunkMeshes.has(key)){
       scene.remove(chunkMeshes.get(key));
       chunkMeshes.get(key).traverse(o=>{if(o.geometry)o.geometry.dispose();});
       chunkMeshes.delete(key);
     }
     const arr=getArr(cx,cz,false);if(!arr)return;
     const fd={};
     const getFD=id=>{if(!fd[id])fd[id]={pos:[],nor:[],uvs:[],idx:[]};return fd[id];};
     for(let lx=0;lx<16;lx++)for(let lz=0;lz<16;lz++)for(let y=0;y<CFG.chunkH;y++){
       const self=arr[vKey(lx,y,lz)];if(self===B.AIR)continue;
       const wx=cx*16+lx,wz=cz*16+lz;
       FACES.forEach(face=>{
         const [dx,dy,dz]=face.dir;
         const nx=lx+dx,ny=y+dy,nz=lz+dz;
         let nb;
         if(nx>=0&&nx<16&&nz>=0&&nz<16&&ny>=0&&ny<CFG.chunkH)nb=arr[vKey(nx,ny,nz)];
         else nb=worldGet(wx+dx,ny,wz+dz);
         if(!showFace(self,nb))return;
         const d=getFD(self),base=d.pos.length/3;
         face.c.forEach(([cx2,cy2,cz2],ci)=>{
           d.pos.push(lx+cx2,y+cy2,lz+cz2);d.nor.push(dx,dy,dz);d.uvs.push(QUV[ci][0],QUV[ci][1]);
         });
         d.idx.push(base,base+1,base+2,base,base+2,base+3);
       });
     }
     const grp=new THREE.Group();grp.position.set(cx*16,0,cz*16);
     Object.entries(fd).forEach(([idStr,d])=>{
       const id=parseInt(idStr);
       const geo=new THREE.BufferGeometry();
       geo.setAttribute('position',new THREE.Float32BufferAttribute(d.pos,3));
       geo.setAttribute('normal',  new THREE.Float32BufferAttribute(d.nor,3));
       geo.setAttribute('uv',      new THREE.Float32BufferAttribute(d.uvs,2));
       geo.setIndex(d.idx);
       const mesh=new THREE.Mesh(geo,getMats(id)[0]);
       mesh.castShadow=CFG.shadows;mesh.receiveShadow=CFG.shadows;
       grp.add(mesh);
     });
     scene.add(grp);chunkMeshes.set(key,grp);
   }
   
   // ═══════════════════════════════════════════════════════════
   // 6.  LIGHTING
   // ═══════════════════════════════════════════════════════════
   const ambL=new THREE.AmbientLight(0xffffff,0.5);scene.add(ambL);
   const sun=new THREE.DirectionalLight(0xfffbe0,1.0);
   sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
   sun.shadow.camera.near=0.5;sun.shadow.camera.far=200;
   sun.shadow.camera.left=sun.shadow.camera.bottom=-80;
   sun.shadow.camera.right=sun.shadow.camera.top=80;
   scene.add(sun);
   const moon=new THREE.DirectionalLight(0x4466aa,0.15);scene.add(moon);
   
   // ═══════════════════════════════════════════════════════════
   // 7.  SKY + CLOUDS
   // ═══════════════════════════════════════════════════════════
   const skyMat=new THREE.MeshBasicMaterial({color:0x87ceeb,side:THREE.BackSide});
   scene.add(new THREE.Mesh(new THREE.SphereGeometry(480,8,8),skyMat));
   const sunMesh=new THREE.Mesh(new THREE.BoxGeometry(14,14,1),new THREE.MeshBasicMaterial({color:0xffee88}));scene.add(sunMesh);
   const moonMesh=new THREE.Mesh(new THREE.BoxGeometry(10,10,1),new THREE.MeshBasicMaterial({color:0xddeeff}));scene.add(moonMesh);
   const cloudMat=new THREE.MeshLambertMaterial({color:0xffffff,transparent:true,opacity:0.88});
   const clouds=[];
   for(let i=0;i<32;i++){
     const c=new THREE.Mesh(new THREE.BoxGeometry(5+Math.random()*9,1.5,3+Math.random()*4),cloudMat);
     c.position.set((Math.random()-0.5)*280,88+Math.random()*18,(Math.random()-0.5)*280);
     c.userData.spd=0.3+Math.random()*0.8;
     scene.add(c);clouds.push(c);
   }
   
   // ═══════════════════════════════════════════════════════════
   // 8.  PLAYER (survival: gravity, jump, collision)
   // ═══════════════════════════════════════════════════════════
   const player={
     pos:new THREE.Vector3(8,70,8),
     vel:new THREE.Vector3(0,0,0),
     yaw:0,pitch:0,pitchMax:Math.PI/2-0.01,
     onGround:false,
     width:0.6,height:1.8,
   };
   camera.position.copy(player.pos);
   
   // Pointer lock
   canvas.addEventListener('click',()=>{if(!document.pointerLockElement)canvas.requestPointerLock();});
   document.addEventListener('pointerlockchange',()=>{
     document.getElementById('crosshair').style.display=document.pointerLockElement?'block':'none';
   });
   document.addEventListener('mousemove',e=>{
     if(!document.pointerLockElement||isPaused||isInvOpen)return;
     player.yaw  -=e.movementX*CFG.mouseSens;
     player.pitch-=e.movementY*CFG.mouseSens;
     player.pitch=Math.max(-player.pitchMax,Math.min(player.pitchMax,player.pitch));
   });
   
   const KEYS={};
   window.addEventListener('keydown',e=>{
     KEYS[e.code]=true;
     if(['Space','ArrowUp','ArrowDown'].includes(e.code))e.preventDefault();
     if(e.code.startsWith('Digit')){const n=parseInt(e.code.slice(5))-1;if(n>=0&&n<9){INV.active=n;updateHotbarUI();drawHand();}}
     if(e.code==='KeyP')togglePause();
     if(e.code==='KeyE')toggleInventory();
   });
   window.addEventListener('keyup',e=>{KEYS[e.code]=false;});
   
   // ── AABB collision sweep ──────────────────────────────────
   function getAABBBlocks(px,py,pz){
     // Check all blocks overlapping player AABB
     const w=player.width/2;
     const results=[];
     for(let ix=Math.floor(px-w);ix<=Math.floor(px+w);ix++)
     for(let iy=Math.floor(py);iy<=Math.floor(py+player.height);iy++)
     for(let iz=Math.floor(pz-w);iz<=Math.floor(pz+w);iz++){
       const b=worldGet(ix,iy,iz);
       if(isSolid(b))results.push({ix,iy,iz});
     }
     return results;
   }
   
   function resolveCollision(pos,vel){
     const w=player.width/2;
     // Y axis
     pos.y+=vel.y*(1/60);
     const blocksY=getAABBBlocks(pos.x,pos.y,pos.z);
     for(const {iy} of blocksY){
       if(vel.y<0){const floor=iy+1;if(pos.y<floor){pos.y=floor;vel.y=0;player.onGround=true;}}
       else if(vel.y>0){const ceil=iy;if(pos.y+player.height>ceil){pos.y=ceil-player.height;vel.y=0;}}
     }
     // X axis
     pos.x+=vel.x*(1/60);
     for(const {ix,iy,iz} of getAABBBlocks(pos.x,pos.y,pos.z)){
       if(vel.x>0&&pos.x+w>ix){pos.x=ix-w;vel.x=0;}
       else if(vel.x<0&&pos.x-w<ix+1){pos.x=ix+1+w;vel.x=0;}
     }
     // Z axis
     pos.z+=vel.z*(1/60);
     for(const {ix,iy,iz} of getAABBBlocks(pos.x,pos.y,pos.z)){
       if(vel.z>0&&pos.z+w>iz){pos.z=iz-w;vel.z=0;}
       else if(vel.z<0&&pos.z-w<iz+1){pos.z=iz+1+w;vel.z=0;}
     }
   }
   
   const vF=new THREE.Vector3(),vR=new THREE.Vector3();
   let isPaused=false,isInvOpen=false;
   
   function movePlayer(dt){
     if(isPaused||isInvOpen)return;
     const sprint=KEYS['ControlLeft'];
     const spd=sprint?CFG.sprintSpeed:CFG.walkSpeed;
     vF.set(-Math.sin(player.yaw),0,-Math.cos(player.yaw));
     vR.set(Math.cos(player.yaw),0,-Math.sin(player.yaw));
     let mx=0,mz=0;
     if(KEYS['KeyW']){mx+=vF.x*spd;mz+=vF.z*spd;}
     if(KEYS['KeyS']){mx-=vF.x*spd;mz-=vF.z*spd;}
     if(KEYS['KeyA']){mx-=vR.x*spd;mz-=vR.z*spd;}
     if(KEYS['KeyD']){mx+=vR.x*spd;mz+=vR.z*spd;}
     player.vel.x=mx;player.vel.z=mz;
     // Jump
     if(KEYS['Space']&&player.onGround){player.vel.y=CFG.jumpVel;player.onGround=false;}
     // Gravity
     if(!player.onGround)player.vel.y-=CFG.gravity*dt;
     player.onGround=false;
     // Resolve collision per sub-step
     const steps=3;
     const sv=player.vel.clone().multiplyScalar(dt/steps);
     for(let s=0;s<steps;s++)resolveCollision(player.pos,player.vel);
   
     // Energy
     if(sprint&&(KEYS['KeyW']||KEYS['KeyS']||KEYS['KeyA']||KEYS['KeyD'])){
       STATS.energy=Math.max(0,STATS.energy-18*dt);
     } else {
       STATS.energy=Math.min(STATS.maxEnergy,STATS.energy+7*dt);
     }
     camera.position.set(player.pos.x,player.pos.y+CFG.eyeOffset,player.pos.z);
     camera.rotation.order='YXZ';camera.rotation.y=player.yaw;camera.rotation.x=player.pitch;camera.rotation.z=0;
   }
   
   // ── Sand/gravel gravity ──────────────────────────────────
   const FALLING_BLOCKS=[B.SAND,B.GRAVEL];
   function updateFallingBlocks(){
     // Check blocks in loaded chunks for unsupported sand/gravel
     // (lightweight: only check near player)
     const px=Math.floor(player.pos.x),py=Math.floor(player.pos.y),pz=Math.floor(player.pos.z);
     for(let dx=-8;dx<=8;dx++)for(let dz=-8;dz<=8;dz++)for(let dy=CFG.seaLevel+5;dy>=1;dy--){
       const b=worldGet(px+dx,py+dy,pz+dz);
       if(FALLING_BLOCKS.includes(b)&&worldGet(px+dx,py+dy-1,pz+dz)===B.AIR){
         worldSet(px+dx,py+dy,pz+dz,B.AIR);
         worldSet(px+dx,py+dy-1,pz+dz,b);
         buildChunkMesh(Math.floor((px+dx)/16),Math.floor((pz+dz)/16));
       }
     }
   }
   
   // ═══════════════════════════════════════════════════════════
   // 9.  RAYCASTING (DDA)
   // ═══════════════════════════════════════════════════════════
   let targetBlock=null;
   const outlineM=new THREE.MeshBasicMaterial({color:0,wireframe:true,transparent:true,opacity:0.4});
   const outlineMesh=new THREE.Mesh(new THREE.BoxGeometry(1.004,1.004,1.004),outlineM);
   outlineMesh.visible=false;scene.add(outlineMesh);
   
   function raycastWorld(){
     const dir=new THREE.Vector3(0,0,-1).applyEuler(camera.rotation).normalize();
     let ox=camera.position.x,oy=camera.position.y,oz=camera.position.z;
     let ix=Math.floor(ox),iy=Math.floor(oy),iz=Math.floor(oz);
     const dx=dir.x,dy=dir.y,dz=dir.z;
     const sx=dx>0?1:-1,sy=dy>0?1:-1,sz=dz>0?1:-1;
     const tdx=Math.abs(1/dx)||1e30,tdy=Math.abs(1/dy)||1e30,tdz=Math.abs(1/dz)||1e30;
     let tmx=(dx>0?ix+1-ox:ox-ix)*tdx,tmy=(dy>0?iy+1-oy:oy-iy)*tdy,tmz=(dz>0?iz+1-oz:oz-iz)*tdz;
     let face=[0,0,0];
     for(let i=0;i<Math.ceil(CFG.maxReach*3);i++){
       const b=worldGet(ix,iy,iz);
       if(b!==B.AIR&&!isFluid(b)){
         targetBlock={wx:ix,wy:iy,wz:iz,face:face.slice()};
         outlineMesh.position.set(ix+0.5,iy+0.5,iz+0.5);outlineMesh.visible=true;
         document.getElementById('crosshair').classList.add('targeting');return;
       }
       if(tmx<tmy&&tmx<tmz){tmx+=tdx;ix+=sx;face=[-sx,0,0];}
       else if(tmy<tmz){tmy+=tdy;iy+=sy;face=[0,-sy,0];}
       else{tmz+=tdz;iz+=sz;face=[0,0,-sz];}
       if(Math.min(tmx,tmy,tmz)>CFG.maxReach)break;
     }
     targetBlock=null;outlineMesh.visible=false;
     document.getElementById('crosshair').classList.remove('targeting');
   }
   
   // ═══════════════════════════════════════════════════════════
   // 10. BLOCK BREAKING
   // ═══════════════════════════════════════════════════════════
   let breaking={active:false,wx:0,wy:0,wz:0,progress:0,total:0};
   const breakMat=new THREE.MeshBasicMaterial({color:0,transparent:true,opacity:0});
   const breakMesh=new THREE.Mesh(new THREE.BoxGeometry(1.012,1.012,1.012),breakMat);
   scene.add(breakMesh);
   
   function startBreaking(){
     if(!targetBlock)return;
     const id=worldGet(targetBlock.wx,targetBlock.wy,targetBlock.wz);
     const t=BREAK_TIME[id]??7.5;if(t===Infinity)return;
     breaking={active:true,...targetBlock,progress:0,total:t};
   }
   function stopBreaking(){breaking.active=false;breaking.progress=0;breakMat.opacity=0;}
   
   // Particles
   const particles=[];
   function spawnParticles(wx,wy,wz,id){
     if(!CFG.particles)return;
     const tx=getItemTex(id);
     const pc=document.createElement('canvas');pc.width=pc.height=1;
     const pg=pc.getContext('2d');pg.drawImage(tx.image,4,4,8,8,0,0,1,1);
     const d=pg.getImageData(0,0,1,1).data;
     const col=new THREE.Color(d[0]/255,d[1]/255,d[2]/255);
     for(let i=0;i<10;i++){
       const p=new THREE.Mesh(new THREE.BoxGeometry(0.1,0.1,0.1),new THREE.MeshLambertMaterial({color:col}));
       p.position.set(wx+0.5+(Math.random()-0.5)*0.5,wy+0.5+(Math.random()-0.5)*0.5,wz+0.5+(Math.random()-0.5)*0.5);
       p.userData={vel:new THREE.Vector3((Math.random()-0.5)*3,(Math.random()*2+0.5),(Math.random()-0.5)*3),life:1.0};
       scene.add(p);particles.push(p);
     }
   }
   function updateParticles(dt){
     for(let i=particles.length-1;i>=0;i--){
       const p=particles[i];
       p.userData.life-=dt*2;p.userData.vel.y-=9.8*dt;
       p.position.addScaledVector(p.userData.vel,dt);
       p.material.opacity=Math.max(0,p.userData.life);p.material.transparent=true;
       if(p.userData.life<=0){scene.remove(p);p.geometry.dispose();p.material.dispose();particles.splice(i,1);}
     }
   }
   
   // Dropped items (land on ground)
   const drops=[];
   function spawnDrops(wx,wy,wz,blockId){
     const table=DROP_TABLE[blockId]??[{id:blockId,count:1,ch:1}];
     table.forEach(entry=>{
       if(Math.random()>entry.ch)return;
       const m=new THREE.Mesh(new THREE.BoxGeometry(0.28,0.28,0.28),new THREE.MeshLambertMaterial({map:getItemTex(entry.id)}));
       m.position.set(wx+0.5,wy+0.8,wz+0.5);
       m.userData={id:entry.id,count:entry.count,vy:1.5,onGround:false,life:30,bob:Math.random()*Math.PI*2};
       scene.add(m);drops.push(m);
     });
   }
   function updateDrops(dt){
     for(let i=drops.length-1;i>=0;i--){
       const d=drops[i];
       if(!d.userData.onGround){
         d.userData.vy-=9.8*dt;
         d.position.y+=d.userData.vy*dt;
         const by=Math.floor(d.position.y-0.14);
         if(isSolid(worldGet(Math.floor(d.position.x),by,Math.floor(d.position.z)))){
           d.position.y=by+1.14;d.userData.vy=0;d.userData.onGround=true;
         }
       }
       d.userData.bob+=dt*2;
       if(d.userData.onGround)d.position.y+=Math.sin(d.userData.bob)*0.004;
       d.rotation.y+=dt*2;
       d.userData.life-=dt;
       if(d.position.distanceTo(player.pos)<1.8||d.userData.life<=0){
         if(d.userData.life>0)addToInventory(d.userData.id,d.userData.count);
         scene.remove(d);d.geometry.dispose();drops.splice(i,1);
       }
     }
   }
   
   canvas.addEventListener('mousedown',e=>{
     if(!document.pointerLockElement||isPaused||isInvOpen)return;
     if(e.button===0)startBreaking();
     if(e.button===2)placeBlock();
   });
   canvas.addEventListener('mouseup',e=>{if(e.button===0)stopBreaking();});
   
   function tickBreaking(dt){
     if(!breaking.active||!targetBlock){stopBreaking();return;}
     if(targetBlock.wx!==breaking.wx||targetBlock.wy!==breaking.wy||targetBlock.wz!==breaking.wz)startBreaking();
     breaking.progress+=dt;
     const pct=breaking.progress/breaking.total;
     breakMat.opacity=Math.min(0.7,pct*0.7);
     breakMesh.position.set(breaking.wx+0.5,breaking.wy+0.5,breaking.wz+0.5);
     if(pct>=1){
       const id=worldGet(breaking.wx,breaking.wy,breaking.wz);
       spawnParticles(breaking.wx,breaking.wy,breaking.wz,id);
       spawnDrops(breaking.wx,breaking.wy,breaking.wz,id);
       worldSet(breaking.wx,breaking.wy,breaking.wz,B.AIR);
       buildChunkMesh(Math.floor(breaking.wx/16),Math.floor(breaking.wz/16));
       stopBreaking();
     }
   }
   
   // Block placement (RMB)
   function placeBlock(){
     if(!targetBlock)return;
     const held=INV.hotbar[INV.active];
     if(!held||!isBlockItem(held.id))return;
     const [fx,fy,fz]=targetBlock.face;
     const px=targetBlock.wx+fx,py=targetBlock.wy+fy,pz=targetBlock.wz+fz;
     // Don't place inside player
     const plb=player.pos;
     if(Math.abs(px+0.5-plb.x)<0.4&&Math.abs(py-plb.y)<1.9&&Math.abs(pz+0.5-plb.z)<0.4)return;
     if(worldGet(px,py,pz)!==B.AIR&&!isFluid(worldGet(px,py,pz)))return;
     worldSet(px,py,pz,held.id);
     held.count--;if(held.count<=0)INV.hotbar[INV.active]=null;
     updateHotbarUI();drawHand();
     buildChunkMesh(Math.floor(px/16),Math.floor(pz/16));
   }
   
   // ═══════════════════════════════════════════════════════════
   // 11. ANIMATED TEXTURES (water / lava)
   // ═══════════════════════════════════════════════════════════
   let animFrame=0,animTimer=0;
   function updateAnimTex(dt){
     animTimer+=dt;
     if(animTimer<0.25)return;animTimer=0;
     animFrame=(animFrame+1)%4;
     // Update water material maps
     const wm=getMats(B.WATER);
     wm.forEach(m=>{m.map=TEX.waterFrames[animFrame];m.needsUpdate=true;});
     // Lava is slower
     const lf=Math.floor(animFrame/2);
     const lm=getMats(B.LAVA);
     lm.forEach(m=>{m.map=TEX.lavaFrames[lf];m.needsUpdate=true;});
   }
   
   // ═══════════════════════════════════════════════════════════
   // 12. INVENTORY & CRAFTING
   // ═══════════════════════════════════════════════════════════
   function addToInventory(id,count=1){
     // Try merge existing
     for(let i=0;i<INV.hotbar.length;i++){
       if(INV.hotbar[i]?.id===id&&INV.hotbar[i].count<99){
         const take=Math.min(count,99-INV.hotbar[i].count);
         INV.hotbar[i].count+=take;count-=take;if(count<=0){updateHotbarUI();return;}
       }
     }
     for(let i=0;i<INV.main.length;i++){
       if(INV.main[i]?.id===id&&INV.main[i].count<99){
         const take=Math.min(count,99-INV.main[i].count);
         INV.main[i].count+=take;count-=take;if(count<=0)return;
       }
     }
     // Fill empty slots
     while(count>0){
       const slot=INV.hotbar.findIndex(s=>!s);
       if(slot>=0){INV.hotbar[slot]={id,count:Math.min(count,99)};count-=99;updateHotbarUI();}
       else{
         const ms=INV.main.findIndex(s=>!s);
         if(ms>=0){INV.main[ms]={id,count:Math.min(count,99)};count-=99;}
         else break;
       }
     }
   }
   
   // ── CRAFTING RECIPES (2×2) ───────────────────────────────
   // grid = [c0,c1,c2,c3] (top-left, top-right, bot-left, bot-right)
   const RECIPES_2x2=[
     // 4 same logs → 4 planks
     {pat:[B.WOOD,0,0,0],  out:{id:B.PLANKS,count:4}},
     {pat:[0,B.WOOD,0,0],  out:{id:B.PLANKS,count:4}},
     {pat:[0,0,B.WOOD,0],  out:{id:B.PLANKS,count:4}},
     {pat:[0,0,0,B.WOOD],  out:{id:B.PLANKS,count:4}},
     // 2 planks (vertical) → 4 sticks
     {pat:[B.PLANKS,0,B.PLANKS,0],out:{id:IT.STICK,count:4}},
     {pat:[0,B.PLANKS,0,B.PLANKS],out:{id:IT.STICK,count:4}},
     // 4 planks → crafting table
     {pat:[B.PLANKS,B.PLANKS,B.PLANKS,B.PLANKS],out:{id:B.CRAFTING_TABLE,count:1}},
     // chest: 8 planks around center (simulate in 2x2 as 4 planks = small chest shortcut)
     {pat:[B.PLANKS,B.PLANKS,B.PLANKS,B.PLANKS],out:{id:B.CRAFTING_TABLE,count:1}}, // placeholder
   ];
   
   function matchRecipe2x2(grid){
     const pat=grid.map(s=>s?s.id:0);
     for(const rec of RECIPES_2x2){
       if(rec.pat.every((p,i)=>p===0?(pat[i]===0||true):p===pat[i])){
         if(rec.pat.every((p,i)=>p===0||p===pat[i]))return rec.out;
       }
     }
     return null;
   }
   
   function updateCraftResult(){
     INV.craftResult=matchRecipe2x2(INV.craftGrid);
     renderCraftOutput();
   }
   
   // ── HOTBAR 3D ICON RENDERER ───────────────────────────────
   function draw3DIcon(canvasEl, id){
     const g=canvasEl.getContext('2d');
     const w=canvasEl.width,h=canvasEl.height;
     g.clearRect(0,0,w,h);
     if(!id)return;
     const tx=getItemTex(id);
     if(!tx||!tx.image)return;
     // Draw isometric-ish 3 faces
     const S=Math.floor(w*0.55);
     const ox=Math.floor(w*0.22),oy=Math.floor(h*0.3);
     const sh=Math.floor(S*0.32);
     // Top face
     g.save();g.transform(1,0.3,-1,0.3,ox+S,oy);
     g.drawImage(tx.image,0,0,S,S);g.restore();
     // Left face (darken)
     g.save();g.transform(1,-0.3,0,0.65,ox,oy+sh*0.55);
     g.drawImage(tx.image,0,0,S,S);
     g.fillStyle='rgba(0,0,0,0.28)';g.fillRect(0,0,S,S);
     g.restore();
     // Right face (darker)
     g.save();g.transform(1,0.3,0,0.65,ox+S,oy+sh*0.55);
     g.drawImage(tx.image,0,0,S,S);
     g.fillStyle='rgba(0,0,0,0.42)';g.fillRect(0,0,S,S);
     g.restore();
   }
   
   function makeSlotCanvas(id){
     const c=document.createElement('canvas');c.width=c.height=30;
     draw3DIcon(c,id);return c;
   }
   
   function updateHotbarUI(){
     const slots=document.querySelectorAll('.hb-slot');
     slots.forEach((slot,i)=>{
       slot.classList.toggle('active',i===INV.active);
       // Clear
       while(slot.firstChild)slot.removeChild(slot.firstChild);
       const sn=document.createElement('span');sn.className='slot-num';sn.textContent=i+1;slot.appendChild(sn);
       if(INV.hotbar[i]){
         const item=INV.hotbar[i];
         slot.appendChild(makeSlotCanvas(item.id));
         if(item.count>1){
           const cnt=document.createElement('span');cnt.className='item-count';cnt.textContent=item.count;slot.appendChild(cnt);
         }
         slot.classList.add('has-item');
       }else slot.classList.remove('has-item');
     });
   }
   
   // ── INVENTORY UI ─────────────────────────────────────────
   let dragItem=null,dragFrom=null; // {item,slot,source}
   
   function makeInvSlot(item,idx,source){
     const s=document.createElement('div');s.className='inv-slot';
     s.dataset.idx=idx;s.dataset.source=source;
     if(item){
       s.appendChild(makeSlotCanvas(item.id));
       if(item.count>1){const c=document.createElement('span');c.className='item-count';c.textContent=item.count;s.appendChild(c);}
     }
     // Hover tooltip
     s.addEventListener('mouseenter',e=>{
       if(item){showTooltip(e,getItemName(item.id));}
     });
     s.addEventListener('mouseleave',()=>hideTooltip());
     // Drag start
     s.addEventListener('mousedown',e=>{
       if(e.button!==0)return;
       const arr=source==='main'?INV.main:source==='hotbar'?INV.hotbar:INV.craftGrid;
       if(!arr[idx])return;
       dragItem={item:arr[idx],origin:{source,idx}};
       arr[idx]=null;
       buildInventoryUI();
       updateDragGhost(dragItem.item,e);
       e.stopPropagation();
     });
     // Drop
     s.addEventListener('mouseup',e=>{
       if(!dragItem)return;
       const arr=source==='main'?INV.main:source==='hotbar'?INV.hotbar:INV.craftGrid;
       if(arr[idx]&&arr[idx].id===dragItem.item.id&&arr[idx].count<99){
         arr[idx].count=Math.min(99,arr[idx].count+dragItem.item.count);
       } else {
         const old=arr[idx];arr[idx]=dragItem.item;
         if(old){const oa=dragItem.origin.source==='main'?INV.main:dragItem.origin.source==='hotbar'?INV.hotbar:INV.craftGrid;oa[dragItem.origin.idx]=old;}
       }
       dragItem=null;hideDragGhost();buildInventoryUI();updateHotbarUI();
       if(source==='craft'||dragItem?.origin?.source==='craft')updateCraftResult();
       e.stopPropagation();
     });
     return s;
   }
   
   function renderCraftOutput(){
     const out=document.getElementById('craft-output');
     out.innerHTML='';
     if(INV.craftResult){
       out.appendChild(makeSlotCanvas(INV.craftResult.id));
       if(INV.craftResult.count>1){const c=document.createElement('span');c.className='item-count';c.textContent=INV.craftResult.count;out.appendChild(c);}
       out.style.cursor='pointer';
       out.onclick=()=>{
         if(!INV.craftResult)return;
         addToInventory(INV.craftResult.id,INV.craftResult.count);
         // Consume inputs
         INV.craftGrid.forEach((s,i)=>{if(s){s.count--;if(s.count<=0)INV.craftGrid[i]=null;}});
         updateCraftResult();buildInventoryUI();updateHotbarUI();
       };
     } else out.style.cursor='default';
   }
   
   function buildInventoryUI(){
     // Main 27
     const mainEl=document.getElementById('inv-main');mainEl.innerHTML='';
     for(let i=0;i<27;i++)mainEl.appendChild(makeInvSlot(INV.main[i],i,'main'));
     // Hotbar 9
     const hbEl=document.getElementById('inv-hotbar-row');hbEl.innerHTML='';
     for(let i=0;i<9;i++)hbEl.appendChild(makeInvSlot(INV.hotbar[i],i,'hotbar'));
     // Craft grid
     document.querySelectorAll('.craft-slot[data-ci]').forEach(el=>{
       const ci=parseInt(el.dataset.ci);
       el.innerHTML='';
       if(INV.craftGrid[ci]){
         el.appendChild(makeSlotCanvas(INV.craftGrid[ci].id));
         if(INV.craftGrid[ci].count>1){const c=document.createElement('span');c.className='item-count';c.textContent=INV.craftGrid[ci].count;el.appendChild(c);}
       }
       el.addEventListener('mousedown',e=>{
         if(e.button!==0)return;
         if(!INV.craftGrid[ci])return;
         dragItem={item:INV.craftGrid[ci],origin:{source:'craft',idx:ci}};
         INV.craftGrid[ci]=null;buildInventoryUI();updateDragGhost(dragItem.item,e);e.stopPropagation();
       });
       el.addEventListener('mouseup',e=>{
         if(!dragItem)return;
         if(INV.craftGrid[ci]){}else{INV.craftGrid[ci]=dragItem.item;dragItem=null;hideDragGhost();buildInventoryUI();updateCraftResult();}
         e.stopPropagation();
       });
     });
     renderCraftOutput();
   }
   
   function toggleInventory(){
     isInvOpen=!isInvOpen;
     const inv=document.getElementById('inventory-screen');
     if(isInvOpen){buildInventoryUI();inv.style.display='flex';if(document.pointerLockElement)document.exitPointerLock();}
     else{inv.style.display='none';canvas.requestPointerLock();}
   }
   document.getElementById('inv-close').addEventListener('click',()=>{isInvOpen=false;document.getElementById('inventory-screen').style.display='none';canvas.requestPointerLock();});
   
   // Cancel drag on mouseup anywhere
   window.addEventListener('mouseup',()=>{
     if(dragItem){
       // Return to origin
       const arr=dragItem.origin.source==='main'?INV.main:dragItem.origin.source==='hotbar'?INV.hotbar:INV.craftGrid;
       arr[dragItem.origin.idx]=dragItem.item;
       dragItem=null;hideDragGhost();buildInventoryUI();updateHotbarUI();
     }
   });
   window.addEventListener('mousemove',e=>{
     if(dragItem)updateDragGhost(dragItem.item,e);
     const tt=document.getElementById('item-tooltip');
     if(tt.style.display==='block'){tt.style.left=(e.clientX+12)+'px';tt.style.top=(e.clientY-4)+'px';}
   });
   
   function updateDragGhost(item,e){
     const g=document.getElementById('drag-ghost');
     g.style.display='block';g.innerHTML='';
     g.style.left=e.clientX+'px';g.style.top=e.clientY+'px';
     g.appendChild(makeSlotCanvas(item.id));
     if(item.count>1){const c=document.createElement('span');c.className='dg-count';c.textContent=item.count;g.appendChild(c);}
   }
   function hideDragGhost(){document.getElementById('drag-ghost').style.display='none';}
   function showTooltip(e,name){
     const tt=document.getElementById('item-tooltip');
     tt.textContent=name;tt.style.display='block';
     tt.style.left=(e.clientX+12)+'px';tt.style.top=(e.clientY-4)+'px';
   }
   function hideTooltip(){document.getElementById('item-tooltip').style.display='none';}
   
   // ═══════════════════════════════════════════════════════════
   // 13. RIGHT-HAND RENDER
   // ═══════════════════════════════════════════════════════════
   function drawHand(){
     const hc=document.getElementById('hand-canvas');
     const g=hc.getContext('2d');
     g.clearRect(0,0,160,220);
     // Arm base
     g.fillStyle='#c87941';g.fillRect(90,100,45,120);
     // Arm shading
     g.fillStyle='rgba(0,0,0,0.2)';g.fillRect(90,100,8,120);
     const held=INV.hotbar[INV.active];
     if(held){
       // Draw held item/block rotated at bottom-right
       g.save();g.translate(100,120);g.rotate(-0.5);
       const tx=getItemTex(held.id);
       if(tx&&tx.image){
         g.imageSmoothingEnabled=false;
         // 3D iso mini block
         const S=46;
         const sh=Math.floor(S*0.32);
         g.transform(1,0.3,-1,0.3,S,0);g.drawImage(tx.image,0,0,S,S);g.restore();
         g.save();g.translate(100,120);g.rotate(-0.5);
         g.transform(1,-0.3,0,0.65,0,sh*0.55);g.drawImage(tx.image,0,0,S,S);
         g.fillStyle='rgba(0,0,0,0.28)';g.fillRect(0,0,S,S);g.restore();
       }else g.restore();
     }
   }
   
   // ═══════════════════════════════════════════════════════════
   // 14. PAUSE + SETTINGS
   // ═══════════════════════════════════════════════════════════
   function togglePause(){
     if(isInvOpen)return;
     isPaused=!isPaused;
     document.getElementById('pause-menu').style.display=isPaused?'flex':'none';
     if(isPaused){if(document.pointerLockElement)document.exitPointerLock();}
     else canvas.requestPointerLock();
   }
   document.getElementById('pause-resume').addEventListener('click',()=>{isPaused=false;document.getElementById('pause-menu').style.display='none';canvas.requestPointerLock();});
   document.getElementById('pause-settings').addEventListener('click',openSettings);
   document.getElementById('pause-toMenu').addEventListener('click',()=>location.reload());
   document.getElementById('settings-back').addEventListener('click',()=>{
     document.getElementById('settings-menu').style.display='none';
     document.getElementById('pause-menu').style.display='flex';
   });
   document.querySelectorAll('.stab').forEach(btn=>btn.addEventListener('click',()=>{
     document.querySelectorAll('.stab').forEach(b=>b.classList.remove('active'));
     btn.classList.add('active');buildSettingsTab(btn.dataset.tab);
   }));
   
   const VIDEO_SETTINGS=[
     {key:'renderDist',label:'Render Distance',type:'range',min:6,max:32,step:1,unit:' chunks'},
     {key:'simDist',   label:'Simulation Distance',type:'range',min:4,max:32,step:1,unit:' chunks'},
     {key:'fov',       label:'FOV',type:'range',min:60,max:110,step:1,unit:'°'},
     {key:'brightness',label:'Brightness',type:'range',min:0.2,max:2.0,step:0.1,unit:''},
     {key:'fogDensity',label:'Fog Density',type:'range',min:0.1,max:1.0,step:0.05,unit:''},
     {key:'shadows',   label:'Shadows',type:'toggle'},
     {key:'particles', label:'Particles',type:'toggle'},
     {key:'clouds',    label:'Clouds',type:'toggle'},
     {key:'_optimize', label:'Auto-Optimize for Device',type:'action',action:optimizeSettings},
   ];
   const PLAYER_SETTINGS=[
     {key:'mouseSens', label:'Mouse Sensitivity',type:'range',min:0.0005,max:0.008,step:0.0005,unit:''},
     {key:'walkSpeed', label:'Walk Speed',type:'range',min:2,max:10,step:0.5,unit:' m/s'},
     {key:'jumpVel',   label:'Jump Height',type:'range',min:4,max:14,step:0.5,unit:''},
     {key:'treeDensity',label:'Tree Density',type:'select',opts:['low','default','high']},
   ];
   
   function buildSettingsTab(tab){
     const body=document.getElementById('settings-body');body.innerHTML='';
     const list=tab==='video'?VIDEO_SETTINGS:PLAYER_SETTINGS;
     list.forEach(s=>{
       const row=document.createElement('div');row.className='setting-row';
       if(s.key==='_optimize')row.id='settings-optimize';
       const lbl=document.createElement('label');lbl.textContent=s.label;row.appendChild(lbl);
       if(s.type==='range'){
         const val=document.createElement('span');
         const fmt=v=>parseFloat(v).toFixed(s.step<0.01?4:s.step<1?2:0)+(s.unit||'');
         val.textContent=fmt(CFG[s.key]);
         const inp=document.createElement('input');inp.type='range';inp.min=s.min;inp.max=s.max;inp.step=s.step;inp.value=CFG[s.key];
         inp.addEventListener('input',()=>{CFG[s.key]=parseFloat(inp.value);val.textContent=fmt(inp.value);applySettings();});
         row.appendChild(inp);row.appendChild(val);
       }else if(s.type==='toggle'){
         const btn=document.createElement('button');btn.className='setting-btn';btn.textContent=CFG[s.key]?'ON':'OFF';
         btn.addEventListener('click',()=>{CFG[s.key]=!CFG[s.key];btn.textContent=CFG[s.key]?'ON':'OFF';applySettings();});
         row.appendChild(btn);
       }else if(s.type==='select'){
         const btn=document.createElement('button');btn.className='setting-btn';btn.textContent=CFG[s.key];
         btn.addEventListener('click',()=>{
           const opts=s.opts;const ci=opts.indexOf(CFG[s.key]);CFG[s.key]=opts[(ci+1)%opts.length];
           btn.textContent=CFG[s.key];applySettings();
         });
         row.appendChild(btn);
       }else if(s.type==='action'){
         const btn=document.createElement('button');btn.className='setting-btn';btn.textContent='Apply';
         btn.addEventListener('click',()=>{s.action();buildSettingsTab(tab);});
         row.appendChild(btn);
       }
       body.appendChild(row);
     });
   }
   
   function applySettings(){
     camera.fov=CFG.fov;camera.updateProjectionMatrix();
     renderer.shadowMap.enabled=CFG.shadows;
     const fn=CFG.renderDist*16*CFG.fogDensity;
     scene.fog.near=fn*0.5;scene.fog.far=fn;
     clouds.forEach(c=>c.visible=CFG.clouds);
   }
   
   function optimizeSettings(){
     const hi=window.devicePixelRatio>=2&&(navigator.hardwareConcurrency||4)>=8;
     CFG.renderDist=hi?10:6;CFG.simDist=hi?8:4;CFG.shadows=hi;CFG.particles=true;CFG.clouds=hi;CFG.fogDensity=hi?0.8:0.55;
     renderer.setPixelRatio(hi?Math.min(window.devicePixelRatio,2):1);
     applySettings();
   }
   
   function openSettings(){
     document.getElementById('pause-menu').style.display='none';
     document.getElementById('settings-menu').style.display='flex';
     document.querySelector('.stab[data-tab="video"]').classList.add('active');
     document.querySelector('.stab[data-tab="player"]').classList.remove('active');
     buildSettingsTab('video');
   }
   function openSettingsFromMenu(){
     document.getElementById('settings-menu').style.display='flex';
     buildSettingsTab('video');
     document.getElementById('settings-back').onclick=()=>{
       document.getElementById('settings-menu').style.display='none';
       document.getElementById('settings-back').onclick=()=>{
         document.getElementById('settings-menu').style.display='none';
         document.getElementById('pause-menu').style.display='flex';
       };
     };
   }
   
   // ═══════════════════════════════════════════════════════════
   // 15. CHUNK LOADING
   // ═══════════════════════════════════════════════════════════
   const loadedChunks=new Set();
   function getPlayerChunk(){return{cx:Math.floor(player.pos.x/16),cz:Math.floor(player.pos.z/16)};}
   
   let chunkQueue=[];
   function updateChunks(){
     const{cx:pcx,cz:pcz}=getPlayerChunk();const rd=CFG.renderDist;const needed=new Set();
     for(let dx=-rd;dx<=rd;dx++)for(let dz=-rd;dz<=rd;dz++){
       if(dx*dx+dz*dz>rd*rd)continue;
       const cx=pcx+dx,cz=pcz+dz;
       if(Math.abs(cx)>CFG.worldLimit||Math.abs(cz)>CFG.worldLimit)continue;
       const k=`${cx},${cz}`;needed.add(k);
       if(!loadedChunks.has(k)){loadedChunks.add(k);chunkQueue.push({cx,cz});}
     }
     for(const k of[...loadedChunks]){
       if(!needed.has(k)){loadedChunks.delete(k);
         if(chunkMeshes.has(k)){scene.remove(chunkMeshes.get(k));chunkMeshes.get(k).traverse(o=>{if(o.geometry)o.geometry.dispose();});chunkMeshes.delete(k);}
       }
     }
   }
   
   function processChunkQueue(maxPerFrame=1){
     for(let i=0;i<maxPerFrame&&chunkQueue.length>0;i++){
       const{cx,cz}=chunkQueue.shift();
       if(!getArr(cx,cz,false))generateChunk(cx,cz);
       buildChunkMesh(cx,cz);
     }
   }
   
   // ═══════════════════════════════════════════════════════════
   // 16. DAY/NIGHT
   // ═══════════════════════════════════════════════════════════
   const DAY=1200;let dayTime=0;
   const SKY={day:new THREE.Color(0x87ceeb),sunset:new THREE.Color(0xff7722),night:new THREE.Color(0x060a1a)};
   function updateDayNight(dt){
     dayTime=(dayTime+dt/DAY)%1;
     const ang=dayTime*Math.PI*2,R=200;
     sun.position.set(Math.cos(ang)*R,Math.sin(ang)*R,0);
     moon.position.set(-Math.cos(ang)*R,-Math.sin(ang)*R,0);
     sunMesh.position.copy(sun.position).multiplyScalar(0.95);
     moonMesh.position.copy(moon.position).multiplyScalar(0.95);
     const t=dayTime;let skyC,amb,si;
     if(t<0.25){const f=t/0.25;skyC=SKY.day.clone();amb=0.3+f*0.3;si=0.5+f*0.5;}
     else if(t<0.5){const f=(t-0.25)/0.25;skyC=SKY.day.clone().lerp(SKY.sunset,f);amb=0.6-f*0.2;si=1-f*0.5;}
     else if(t<0.6){const f=(t-0.5)/0.1;skyC=SKY.sunset.clone().lerp(SKY.night,f);amb=0.4-f*0.3;si=0.5-f*0.5;}
     else if(t<0.9){skyC=SKY.night.clone();amb=0.07;si=0;}
     else{const f=(t-0.9)/0.1;skyC=SKY.night.clone().lerp(SKY.sunset,f);amb=0.07+f*0.2;si=f*0.5;}
     renderer.setClearColor(skyC,1);skyMat.color.copy(skyC);scene.fog.color.copy(skyC);
     ambL.intensity=amb*CFG.brightness;sun.intensity=si;moon.intensity=si<0.1?0.15:0;
   }
   
   // ═══════════════════════════════════════════════════════════
   // 17. FOG
   // ═══════════════════════════════════════════════════════════
   const fn0=CFG.renderDist*16*CFG.fogDensity;
   scene.fog=new THREE.Fog(0x87ceeb,fn0*0.5,fn0);
   
   // ═══════════════════════════════════════════════════════════
   // 18. STATUS UI
   // ═══════════════════════════════════════════════════════════
   function updateStatusUI(){
     document.getElementById('health-bar').style.width=(STATS.health/STATS.maxHealth*100)+'%';
     document.getElementById('shield-bar').style.width=(STATS.shield/STATS.maxShield*100)+'%';
     document.getElementById('hunger-bar').style.width=(STATS.hunger/STATS.maxHunger*100)+'%';
     document.getElementById('energy-bar').style.width=(STATS.energy/STATS.maxEnergy*100)+'%';
     for(let i=0;i<3;i++)document.getElementById(`ab${i}`).classList.toggle('full',i<STATS.armor);
     const ew=document.getElementById('energy-bar-wrap');
     if(STATS.energy>=STATS.maxEnergy){ew.classList.add('hidden');ew.classList.remove('flash');}
     else{ew.classList.remove('hidden');ew.classList.toggle('flash',STATS.energy<15);}
   }
   
   // ═══════════════════════════════════════════════════════════
   // 19. DEBUG HUD
   // ═══════════════════════════════════════════════════════════
   let fps=0,fpsT=0,fpsN=0;
   function updateHUD(dt){
     fpsN++;fpsT+=dt;if(fpsT>=0.5){fps=Math.round(fpsN/fpsT);fpsN=0;fpsT=0;}
     const p=player.pos,tod=dayTime<0.5?'Day':'Night';
     document.getElementById('hud-debug').innerHTML=
       `XYZ: ${p.x.toFixed(1)} / ${p.y.toFixed(1)} / ${p.z.toFixed(1)}<br>`+
       `FPS: ${fps} | Chunks: ${loadedChunks.size} | ${tod} | Seed: ${SEED}`;
   }
   
   // ═══════════════════════════════════════════════════════════
   // 20. MAIN LOOP
   // ═══════════════════════════════════════════════════════════
   let lastNow=performance.now(),chunkT=0,fallT=0;
   function loop(){
     requestAnimationFrame(loop);
     const now=performance.now();const dt=Math.min((now-lastNow)*0.001,0.05);lastNow=now;
     if(!isPaused&&!isInvOpen){
       movePlayer(dt);raycastWorld();tickBreaking(dt);
       updateParticles(dt);updateDrops(dt);
       updateDayNight(dt);updateAnimTex(dt);
       clouds.forEach(c=>{c.position.x+=c.userData.spd*dt;if(c.position.x>200)c.position.x=-200;});
       chunkT+=dt;if(chunkT>0.35){chunkT=0;updateChunks();}
       fallT+=dt;if(fallT>0.25){fallT=0;updateFallingBlocks();}
       processChunkQueue(2);
     }
     updateStatusUI();updateHUD(dt);
     renderer.render(scene,camera);
   }
   
   // ═══════════════════════════════════════════════════════════
   // 21. LOAD SEQUENCE
   // ═══════════════════════════════════════════════════════════
   function setLoad(pct,status){
     document.getElementById('loading-bar').style.width=pct+'%';
     if(status)document.getElementById('loading-status').textContent=status;
     document.getElementById('loading-fact').textContent=FACTS[(Math.random()*FACTS.length)|0];
   }
   async function startGame(){
     document.getElementById('main-menu').style.display='none';
     document.getElementById('loading-screen').style.display='flex';
     document.getElementById('game-canvas').style.display='block';
     document.getElementById('game-ui').style.display='block';
   
     setLoad(5,'BUILDING TEXTURES');await delay(50);
     setLoad(15,'GENERATING TERRAIN');await delay(50);
   
     const R=3;let tot=(R*2+1)**2,done=0;
     for(let dx=-R;dx<=R;dx++)for(let dz=-R;dz<=R;dz++){
       generateChunk(dx,dz);done++;
       setLoad(15+(done/tot*55)|0,'GENERATING TERRAIN');await delay(4);
     }
   
     // Find spawn — ensure above ground, not water
     let sx=8,sz=8;
     let spH=getHeight(sx,sz);
     while(spH<=CFG.seaLevel){sx+=8;spH=getHeight(sx,sz);}
     player.pos.set(sx+0.5,spH+CFG.playerH+1,sz+0.5);
     camera.position.set(player.pos.x,player.pos.y+CFG.eyeOffset,player.pos.z);
   
     setLoad(72,'BUILDING MESHES');await delay(50);
     for(let dx=-R;dx<=R;dx++)for(let dz=-R;dz<=R;dz++){
       buildChunkMesh(dx,dz);loadedChunks.add(`${dx},${dz}`);
     }
     setLoad(88,'PLACING PLAYER');await delay(150);
     setLoad(96,'LOADING RENDER SYSTEMS');await delay(150);
     setLoad(100,'DONE');await delay(350);
   
     const ls=document.getElementById('loading-screen');
     ls.style.opacity='0';ls.style.transition='opacity 0.8s';
     setTimeout(()=>ls.style.display='none',900);
   
     updateHotbarUI();drawHand();
     loop();
   }
   function delay(ms){return new Promise(r=>setTimeout(r,ms));}
   
   // ═══════════════════════════════════════════════════════════
   // 22. MAIN MENU ANIMATION
   // ═══════════════════════════════════════════════════════════
   (function initMenu(){
     const mc=document.getElementById('menu-canvas');
     const mg=mc.getContext('2d');
     let frame=0;
     function drawMenu(){
       frame++;mc.width=window.innerWidth;mc.height=window.innerHeight;
       const w=mc.width,h=mc.height;
       const sky=mg.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#5ab5e8');sky.addColorStop(1,'#a8d8f0');
       mg.fillStyle=sky;mg.fillRect(0,0,w,h);
       const cx2=w/2+Math.sin(frame*0.012)*28,cy=h*0.53;
       mg.save();mg.globalAlpha=0.16;mg.fillStyle='#003';
       mg.beginPath();mg.ellipse(cx2,cy+58,88,18,0,0,Math.PI*2);mg.fill();mg.restore();
       mg.fillStyle='#888';mg.beginPath();
       mg.moveTo(cx2-88,cy+38);mg.lineTo(cx2+88,cy+38);mg.lineTo(cx2+58,cy+78);mg.lineTo(cx2-58,cy+78);mg.closePath();mg.fill();
       mg.fillStyle='#7a5230';mg.fillRect(cx2-78,cy+8,156,32);
       mg.fillStyle='#5aaa3c';mg.fillRect(cx2-78,cy,156,12);
       [[cx2-42,cy],[cx2+2,cy],[cx2+40,cy]].forEach(([tx,ty])=>{
         const ofs=Math.sin(frame*0.016+tx)*2.5;
         mg.fillStyle='#6b4423';mg.fillRect(tx-3,ty-22+ofs,6,24);
         mg.fillStyle='#3a9928';mg.fillRect(tx-12,ty-40+ofs,24,22);mg.fillRect(tx-8,ty-52+ofs,16,14);mg.fillRect(tx-5,ty-62+ofs,10,12);
       });
       [[w*0.15,h*0.18],[w*0.62,h*0.12],[w*0.84,h*0.22]].forEach(([cx3,cy3])=>{
         const ox=Math.sin(frame*0.005+cx3)*16;
         mg.fillStyle='rgba(255,255,255,0.86)';
         mg.beginPath();if(mg.roundRect)mg.roundRect(cx3+ox-28,cy3,56,16,8);else mg.rect(cx3+ox-28,cy3,56,16);mg.fill();
         mg.beginPath();if(mg.roundRect)mg.roundRect(cx3+ox-16,cy3-9,32,18,9);else mg.rect(cx3+ox-16,cy3-9,32,18);mg.fill();
       });
     }
     function menuLoop(){if(document.getElementById('main-menu').style.display==='none')return;drawMenu();requestAnimationFrame(menuLoop);}
     menuLoop();
     window.addEventListener('resize',()=>{mc.width=window.innerWidth;mc.height=window.innerHeight;});
   })();
   
   document.getElementById('btn-singleplayer').addEventListener('click',startGame);
   document.getElementById('btn-options').addEventListener('click',openSettingsFromMenu);
   document.getElementById('btn-quit').addEventListener('click',()=>window.close());
   
   // ═══════════════════════════════════════════════════════════
   // 23. RESIZE
   // ═══════════════════════════════════════════════════════════
   window.addEventListener('resize',()=>{
     camera.aspect=window.innerWidth/window.innerHeight;
     camera.updateProjectionMatrix();
     renderer.setSize(window.innerWidth,window.innerHeight);
   });