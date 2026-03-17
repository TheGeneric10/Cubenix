/* ============================================================
   CUBENIX — script.js — v0.0.54a
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
    walkSpeed:4.5, sprintSpeed:8.3, sneakSpeed:2.6, flySpeed:0,  // no fly in survival
    sprintEnergyDrain:11,
     jumpVel:8.25, gravity:22.0,
     mouseSens:0.0022,
    touchLookSens:1.0,
    autoJump:false,
     worldLimit:812600,
     fov:70, brightness:1.0,
     particlesMode:'default', cloudsMode:'default', shadowsMode:'default',
     fogDensity:0.8,
    leavesQuality:'default', // low | default | medium | high
    autosave:true,
    guiScale:3,
    enableVSync:true,
    enableNixPlus:false,
    enableCubenixMobile:false,
    enableCubenixConnect:false,
    nixSaturation:1.2,
    nixContrast:1.08,
    nixGlow:0.35,
   };

   const AUTOSAVE_KEY='cubenix.autosave.v1';
   const SETTINGS_KEY='cubenix.settings.v1';
   const SEED_KEY='cubenix.seed.v1';
const WORLD_BORDER_BLOCKS=13000000;
   
   // Block IDs
   const B={
     AIR:0,GRASS:1,DIRT:2,STONE:3,BEDROCK:4,
     SAND:5,WOOD:6,LEAVES:7,WATER:8,LAVA:9,
     COAL_ORE:10,IRON_ORE:11,GOLD_ORE:12,DIAMOND_ORE:13,
     GRAVEL:14,CRAFTING_TABLE:15,PLANKS:16,CHEST:17,IRON_CHEST:18,GOLD_CHEST:19,DIAMOND_CHEST:20,TNT:21,IRON_BLOCK:22,GOLD_BLOCK:23,DIAMOND_BLOCK:24,
     COBBLESTONE:25,RED_SAND:26,TORCH:27,
   };
   const BLOCK_NAMES=[
     'Air','Grass','Dirt','Stone','Bedrock','Sand',
     'Oak Log','Leaves','Water','Lava',
     'Coal Ore','Iron Ore','Gold Ore','Diamond Ore',
     'Gravel','Crafting Table','Oak Planks','Chest','Iron Chest','Gold Chest','Diamond Chest','TNT','Iron Block','Gold Block','Diamond Block',
     'Cobblestone','Red Sand','Torch',
   ];

   const WOOL_BASE_ID=30;
   const WOOL_COLORS=[
    {name:'White',hex:'#f1f1f1'},{name:'Orange',hex:'#f39b2f'},{name:'Magenta',hex:'#c856c6'},{name:'Light Blue',hex:'#72a9ff'},
    {name:'Yellow',hex:'#e3d13b'},{name:'Lime',hex:'#7fd34e'},{name:'Pink',hex:'#f7a0c0'},{name:'Gray',hex:'#595959'},
    {name:'Light Gray',hex:'#a0a0a0'},{name:'Cyan',hex:'#2fa6b8'},{name:'Purple',hex:'#7447c6'},{name:'Blue',hex:'#354cb9'},
    {name:'Brown',hex:'#7b5232'},{name:'Green',hex:'#4f8f32'},{name:'Red',hex:'#b64242'},{name:'Black',hex:'#222222'},
    {name:'Crimson',hex:'#cf374f'},{name:'Coral',hex:'#ff7e63'},{name:'Peach',hex:'#ffbc8b'},{name:'Amber',hex:'#ffbe3a'},
    {name:'Mint',hex:'#80e8b5'},{name:'Aqua',hex:'#64e3dd'},{name:'Sky',hex:'#76d1ff'},{name:'Indigo',hex:'#4f58d6'},
    {name:'Violet',hex:'#9d65f5'},{name:'Rose',hex:'#ff79af'},{name:'Salmon',hex:'#ff9180'},{name:'Olive',hex:'#899333'},
    {name:'Teal',hex:'#2f8e8a'},{name:'Navy',hex:'#304c85'},{name:'Maroon',hex:'#7a3040'},{name:'Silver',hex:'#c7ccd3'},
   ];
   for(let i=0;i<WOOL_COLORS.length;i++){
    const id=WOOL_BASE_ID+i;
    B[`WOOL_${i+1}`]=id;
    BLOCK_NAMES[id]=`${WOOL_COLORS[i].name} Wool`;
   }
   
   // Item IDs (non-block items start at 100)
   const IT={
     COAL:100, IRON_INGOT:101, GOLD_INGOT:102, DIAMOND:103,
     STICK:104, WOOD_PICKAXE:105,
     STONE_PICKAXE:106,IRON_PICKAXE:107,GOLD_PICKAXE:108,DIAMOND_PICKAXE:109,
     WOOD_AXE:110,STONE_AXE:111,IRON_AXE:112,GOLD_AXE:113,DIAMOND_AXE:114,
     WOOD_BLADE:115,STONE_BLADE:116,IRON_BLADE:117,GOLD_BLADE:118,DIAMOND_BLADE:119,
     BOAT:120,
     // block items reuse block IDs for placement
   };
   const ITEM_NAMES={
     [IT.COAL]:'Coal',[IT.IRON_INGOT]:'Iron Ingot',
     [IT.GOLD_INGOT]:'Gold Ingot',[IT.DIAMOND]:'Diamond',
     [IT.STICK]:'Stick',[IT.WOOD_PICKAXE]:'Wooden Pickaxe',
     [IT.STONE_PICKAXE]:'Stone Pickaxe',[IT.IRON_PICKAXE]:'Iron Pickaxe',[IT.GOLD_PICKAXE]:'Golden Pickaxe',[IT.DIAMOND_PICKAXE]:'Diamond Pickaxe',
     [IT.WOOD_AXE]:'Wooden Axe',[IT.STONE_AXE]:'Stone Axe',[IT.IRON_AXE]:'Iron Axe',[IT.GOLD_AXE]:'Golden Axe',[IT.DIAMOND_AXE]:'Diamond Axe',
     [IT.WOOD_BLADE]:'Wooden Blade',[IT.STONE_BLADE]:'Stone Blade',[IT.IRON_BLADE]:'Iron Blade',[IT.GOLD_BLADE]:'Golden Blade',[IT.DIAMOND_BLADE]:'Diamond Blade',
     [IT.BOAT]:'Boat',
   };
   function getAllKnownIds(){
  const ids=[...Object.values(B),...Object.values(IT)].filter(Number.isFinite);
  return [...new Set(ids)].sort((a,b)=>a-b);
}
function getItemName(id){
     if(id<100) return BLOCK_NAMES[id]||'Unknown';
     return ITEM_NAMES[id]||'Item '+id;
   }
   function isBlockItem(id){ return id<100 && id!==B.AIR; }
   const TOOL_STATS={
    [IT.WOOD_PICKAXE]:{atk:2,speed:1.15,eff:20,type:'pickaxe'},
    [IT.STONE_PICKAXE]:{atk:3,speed:1.1,eff:35,type:'pickaxe'},
    [IT.IRON_PICKAXE]:{atk:4,speed:1.05,eff:50,type:'pickaxe'},
    [IT.GOLD_PICKAXE]:{atk:3,speed:1.25,eff:65,type:'pickaxe'},
    [IT.DIAMOND_PICKAXE]:{atk:5,speed:1.0,eff:80,type:'pickaxe'},
    [IT.WOOD_AXE]:{atk:3,speed:1.0,eff:18,type:'axe'},
    [IT.STONE_AXE]:{atk:4,speed:0.95,eff:32,type:'axe'},
    [IT.IRON_AXE]:{atk:5,speed:0.9,eff:46,type:'axe'},
    [IT.GOLD_AXE]:{atk:4,speed:1.1,eff:58,type:'axe'},
    [IT.DIAMOND_AXE]:{atk:6,speed:0.85,eff:72,type:'axe'},
    [IT.WOOD_BLADE]:{atk:4,speed:1.4,type:'blade'},
    [IT.STONE_BLADE]:{atk:5,speed:1.35,type:'blade'},
    [IT.IRON_BLADE]:{atk:6,speed:1.28,type:'blade'},
    [IT.GOLD_BLADE]:{atk:5,speed:1.55,type:'blade'},
    [IT.DIAMOND_BLADE]:{atk:8,speed:1.18,type:'blade'},
   };
   function isHardMaterial(id){return id===B.STONE||id===B.COBBLESTONE||id===B.COAL_ORE||id===B.IRON_ORE||id===B.GOLD_ORE||id===B.DIAMOND_ORE||id===B.IRON_BLOCK||id===B.GOLD_BLOCK||id===B.DIAMOND_BLOCK;}
   function isWoodMaterial(id){return id===B.WOOD||id===B.PLANKS||id===B.CRAFTING_TABLE||id===B.CHEST||id===B.IRON_CHEST||id===B.GOLD_CHEST||id===B.DIAMOND_CHEST;}
   function getActiveToolStats(){const held=INV.hotbar[INV.active];return held?TOOL_STATS[held.id]||null:null;}
  function getBreakMultiplier(blockId){
    const t=getActiveToolStats();
    if(!t)return 1;
    const eff=Math.max(0,Math.min(99,Number(t.eff)||0));
    const match=(t.type==='pickaxe'&&isHardMaterial(blockId))||(t.type==='axe'&&isWoodMaterial(blockId));
    if(match)return Math.max(0.08,1-eff/100);
    if(t.type==='pickaxe'||t.type==='axe')return Math.min(0.95,Math.max(0.2,(1-eff/100)*2));
    return 1;
   }
  function getAttackDamage(){
    const t=getActiveToolStats();
    if(!t)return 1;
   return Math.max(1,t.atk);
  }
   const DURABILITY_MAX={
    [IT.WOOD_PICKAXE]:59,[IT.WOOD_AXE]:59,[IT.WOOD_BLADE]:59,
    [IT.STONE_PICKAXE]:131,[IT.STONE_AXE]:131,[IT.STONE_BLADE]:131,
    [IT.IRON_PICKAXE]:250,[IT.IRON_AXE]:250,[IT.IRON_BLADE]:250,
    [IT.GOLD_PICKAXE]:32,[IT.GOLD_AXE]:32,[IT.GOLD_BLADE]:32,
    [IT.DIAMOND_PICKAXE]:1561,[IT.DIAMOND_AXE]:1561,[IT.DIAMOND_BLADE]:1561,
   };
   function isDurableItemId(id){return !!TOOL_STATS[id];}
   function getMaxStackForId(id){return isDurableItemId(id)||id===IT.BOAT?1:99;}
   function getMaxDurabilityForItem(id){return DURABILITY_MAX[id]||1;}
   function makeItemStack(id,count=1){
    const stack={id,count:Math.max(1,Math.min(getMaxStackForId(id),Math.floor(count||1)))};
    if(isDurableItemId(id)){stack.maxDur=getMaxDurabilityForItem(id);stack.dur=stack.maxDur;}
    return stack;
   }
   function ensureStackIntegrity(stack){
    if(!stack)return null;
    stack.count=Math.max(1,Math.min(getMaxStackForId(stack.id),Math.floor(stack.count||1)));
    if(isDurableItemId(stack.id)){
      const max=getMaxDurabilityForItem(stack.id);
      stack.maxDur=max;
      const cur=Number.isFinite(stack.dur)?stack.dur:max;
      stack.dur=Math.max(0,Math.min(max,Math.floor(cur)));
    }else{delete stack.dur;delete stack.maxDur;}
    return stack;
   }
   function formatCompactNumber(n){
    const abs=Math.abs(n);
    if(abs>=1_000_000)return (n/1_000_000).toFixed(abs>=10_000_000?0:1).replace(/\.0$/,'')+'M';
    if(abs>=100_000)return Math.round(n/1_000)+'K';
    if(abs>=10_000)return (n/1_000).toFixed(1).replace(/\.0$/,'')+'K';
    return String(Math.round(n));
   }
   function getItemDescription(id,stack=null){
    const t=TOOL_STATS[id];
    if(!t)return '';
    let desc=t.type==='blade'
      ?`Attack Damage: ${t.atk}\nAttack Speed: ${t.speed.toFixed(2)}`
      :`Attack Damage: ${t.atk}\nEfficiency Rate: ${t.eff}%`;
    const s=stack&&stack.id===id?stack:null;
    if(s&&isDurableItemId(id))desc+=`\n────────\nDurability: ${formatCompactNumber(s.dur)} / ${formatCompactNumber(s.maxDur)}`;
    return desc;
   }
   
   // Break times (seconds, fist)
   const BREAK_TIME={
     [B.GRASS]:0.9,[B.DIRT]:0.75,[B.SAND]:0.75,[B.GRAVEL]:0.75,[B.RED_SAND]:0.75,
     [B.STONE]:7.5,[B.COBBLESTONE]:6.8,[B.COAL_ORE]:7.5,[B.IRON_ORE]:7.5,
     [B.GOLD_ORE]:7.5,[B.DIAMOND_ORE]:7.5,
     [B.WOOD]:3.0,[B.LEAVES]:0.5,[B.PLANKS]:2.0,[B.CRAFTING_TABLE]:3.0,[B.CHEST]:2.6,[B.IRON_CHEST]:3.4,[B.GOLD_CHEST]:3.6,[B.DIAMOND_CHEST]:4.5,[B.TNT]:0.9,[B.IRON_BLOCK]:6.0,[B.GOLD_BLOCK]:6.0,[B.DIAMOND_BLOCK]:6.5,[B.TORCH]:0,
     [B.BEDROCK]:Infinity,[B.WATER]:Infinity,[B.LAVA]:Infinity,
   };
   for(let i=0;i<WOOL_COLORS.length;i++)BREAK_TIME[WOOL_BASE_ID+i]=0.65;
   
   // Drop table: blockId → [{id, count, chance}]
   const DROP_TABLE={
     [B.GRASS]:   [{id:B.DIRT,count:1,ch:1}],
     [B.DIRT]:    [{id:B.DIRT,count:1,ch:1}],
     [B.STONE]:   [{id:B.COBBLESTONE,count:1,ch:1}],
     [B.COBBLESTONE]:[{id:B.COBBLESTONE,count:1,ch:1}],
     [B.SAND]:    [{id:B.SAND,count:1,ch:1}],
     [B.GRAVEL]:  [{id:B.GRAVEL,count:1,ch:1}],
     [B.RED_SAND]:[{id:B.RED_SAND,count:1,ch:1}],
     [B.WOOD]:    [{id:B.WOOD,count:1,ch:1}],
     [B.LEAVES]:  [{id:B.LEAVES,count:1,ch:0.2}],
     [B.PLANKS]:  [{id:B.PLANKS,count:1,ch:1}],
     [B.CRAFTING_TABLE]: [{id:B.CRAFTING_TABLE,count:1,ch:1}],
     [B.CHEST]: [{id:B.CHEST,count:1,ch:1}],
     [B.DIAMOND_CHEST]: [{id:B.DIAMOND_CHEST,count:1,ch:1}],
     [B.IRON_CHEST]: [{id:B.IRON_CHEST,count:1,ch:1}],
     [B.GOLD_CHEST]: [{id:B.GOLD_CHEST,count:1,ch:1}],
     [B.TNT]: [{id:B.TNT,count:1,ch:1}],
     [B.IRON_BLOCK]: [{id:B.IRON_BLOCK,count:1,ch:1}],
     [B.GOLD_BLOCK]: [{id:B.GOLD_BLOCK,count:1,ch:1}],
     [B.DIAMOND_BLOCK]: [{id:B.DIAMOND_BLOCK,count:1,ch:1}],
     [B.TORCH]: [{id:B.TORCH,count:1,ch:1}],
     [B.COAL_ORE]:    [{id:IT.COAL,count:1,ch:1}],
     [B.IRON_ORE]:    [{id:IT.IRON_INGOT,count:2,ch:1}],
     [B.GOLD_ORE]:    [{id:IT.GOLD_INGOT,count:2,ch:1}],
     [B.DIAMOND_ORE]: [{id:IT.DIAMOND,count:1,ch:1}],
     [B.BEDROCK]: [],
   };
   for(let i=0;i<WOOL_COLORS.length;i++)DROP_TABLE[WOOL_BASE_ID+i]=[{id:WOOL_BASE_ID+i,count:1,ch:1}];
   
   // Player stats
  const STATS={
    health:100,maxHealth:100,hunger:20,maxHunger:20,
    shield:10,maxShield:10,armor:0,maxArmor:3,
    energy:100,maxEnergy:100,
    air:100,maxAir:100,
  };
   
   // Inventory
   const INV={
     hotbar:Array(9).fill(null),
     main:Array(27).fill(null),
     active:0,
     craftGridSize:2,
     craftGrid:Array(4).fill(null),
     craftResult:null,
     uiMode:'inventory',
   };
   
   function randomSeed(){
     return Math.floor(Math.random()*9007199254740991);
   }
   let CURRENT_SEED=randomSeed();
   let SEED_NORM=0;
   function setWorldSeed(seed){
     CURRENT_SEED=Number.isFinite(seed)?Math.floor(seed):randomSeed();
     SEED_NORM=((CURRENT_SEED%1000000007)+1000000007)%1000000007;
     try{localStorage.setItem(SEED_KEY,String(CURRENT_SEED));}catch{}
   }
   setWorldSeed(CURRENT_SEED);
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
   });
   
   // Grass SIDE — curved green cap, dirt below
   TEX.grassSide=makeTex(g=>{
     g.fillStyle='#7a5230';g.fillRect(0,0,16,16);
     const r=rng(2);
     for(let i=0;i<32;i++){const v=(r()*18-9)|0;g.fillStyle=`rgb(${122+v},${82+v},${48+v})`;g.fillRect((r()*16)|0,4+(r()*12)|0,1+(r()*2)|0,1);}
     g.fillStyle='#5aaa3c';
     g.beginPath();
     g.moveTo(0,4);g.quadraticCurveTo(8,1.2,16,4);g.lineTo(16,0);g.lineTo(0,0);g.closePath();
     g.fill();
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

  TEX.chestSide=makeTex(g=>{g.fillStyle='#8b5a2b';g.fillRect(0,0,16,16);g.fillStyle='#5a3a1a';g.fillRect(0,0,16,3);g.fillRect(0,13,16,3);g.fillStyle='#b98b4e';g.fillRect(0,6,16,2);g.fillRect(0,9,16,1);g.fillStyle='#d8b87a';g.fillRect(3,7,2,3);g.fillRect(11,7,2,3);});
  TEX.chestTop=makeTex(g=>{g.fillStyle='#9a6a38';g.fillRect(0,0,16,16);g.fillStyle='#6a441f';g.fillRect(0,2,16,2);g.fillRect(0,12,16,2);g.fillStyle='rgba(255,255,255,0.18)';g.fillRect(1,4,14,1);});
  TEX.ironChest=makeTex(g=>{g.fillStyle='#9aa2ab';g.fillRect(0,0,16,16);g.fillStyle='#cfd5de';g.fillRect(0,0,16,3);g.fillStyle='#5c6168';g.fillRect(0,13,16,3);g.fillStyle='#e8ecf2';g.fillRect(3,7,2,3);g.fillRect(11,7,2,3);});
  TEX.goldChest=makeTex(g=>{g.fillStyle='#bf8b18';g.fillRect(0,0,16,16);g.fillStyle='#f0cb55';g.fillRect(0,0,16,3);g.fillStyle='#7d5a0d';g.fillRect(0,13,16,3);g.fillStyle='#ffe184';g.fillRect(3,7,2,3);g.fillRect(11,7,2,3);});
  TEX.diamondChest=makeTex(g=>{g.fillStyle='#38b3c8';g.fillRect(0,0,16,16);g.fillStyle='#7ff2ff';g.fillRect(0,0,16,3);g.fillStyle='#146a7a';g.fillRect(0,13,16,3);g.fillStyle='#b9fbff';g.fillRect(3,7,2,3);g.fillRect(11,7,2,3);});
  TEX.ironBlock=makeTex(g=>{g.fillStyle='#bcc3cc';g.fillRect(0,0,16,16);g.strokeStyle='#8a9098';for(let i=0;i<16;i+=4){g.beginPath();g.moveTo(i,0);g.lineTo(i,16);g.stroke();g.beginPath();g.moveTo(0,i);g.lineTo(16,i);g.stroke();}});
  TEX.goldBlock=makeTex(g=>{g.fillStyle='#d3a223';g.fillRect(0,0,16,16);g.strokeStyle='#9c7311';for(let i=0;i<16;i+=4){g.beginPath();g.moveTo(i,0);g.lineTo(i,16);g.stroke();g.beginPath();g.moveTo(0,i);g.lineTo(16,i);g.stroke();}});
  TEX.diamondBlock=makeTex(g=>{g.fillStyle='#3ec9d8';g.fillRect(0,0,16,16);g.strokeStyle='#248f9b';for(let i=0;i<16;i+=4){g.beginPath();g.moveTo(i,0);g.lineTo(i,16);g.stroke();g.beginPath();g.moveTo(0,i);g.lineTo(16,i);g.stroke();}});
  TEX.tntTop=makeTex(g=>{g.fillStyle='#d22';g.fillRect(0,0,16,16);g.fillStyle='#f55';for(let i=0;i<20;i++)g.fillRect((Math.random()*16)|0,(Math.random()*16)|0,1,1);});
  TEX.tntSide=makeTex(g=>{g.fillStyle='#d22';g.fillRect(0,0,16,16);g.fillStyle='#fff';g.fillRect(0,5,16,6);g.fillStyle='#000';g.font='bold 6px sans-serif';g.fillText('TNT',2,10);});
   
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
  TEX.cobblestone=makeTex(g=>{
    g.fillStyle='#777';g.fillRect(0,0,16,16);
    const r=rng(240);
    for(let i=0;i<42;i++){const v=(r()*40-20)|0;g.fillStyle=`rgb(${119+v},${119+v},${119+v})`;g.fillRect((r()*15)|0,(r()*15)|0,1+(r()*2)|0,1+(r()*2)|0);} 
  });
  TEX.redSand=makeTex(g=>{
    g.fillStyle='#b86a3a';g.fillRect(0,0,16,16);
    const r=rng(241);
    for(let i=0;i<28;i++){const v=(r()*32-16)|0;g.fillStyle=`rgb(${184+v},${106+v},${58+v})`;g.fillRect((r()*15)|0,(r()*15)|0,1+(r()*2)|0,1);} 
  });
  TEX.torch=makeTex(g=>{
    g.clearRect(0,0,16,16);
    g.fillStyle='#f8c74a';g.fillRect(6,1,4,5);
    g.fillStyle='#7a5230';g.fillRect(7,5,2,11);
    g.fillStyle='#ffea9f';g.fillRect(7,2,2,2);
  });

  function makeToolTex(head='#b0832e',handle='#7a5230',shape='pick'){
    return makeTex(g=>{
      g.clearRect(0,0,16,16);
      g.fillStyle=handle;g.fillRect(7,4,2,12);
      g.fillStyle=head;
      if(shape==='pick'){g.fillRect(2,3,12,3);g.fillRect(7,3,2,3);} 
      else if(shape==='axe'){g.fillRect(3,2,8,5);g.fillRect(9,3,3,2);} 
      else {g.fillRect(6,1,4,9);g.fillStyle='#ddd';g.fillRect(7,2,2,1);} 
    });
  }
  TEX.stonePickaxe=makeToolTex('#8d8d8d','#7a5230','pick');
  TEX.ironPickaxe=makeToolTex('#c9c9c9','#7a5230','pick');
  TEX.goldPickaxe=makeToolTex('#f0c040','#7a5230','pick');
  TEX.diamondPickaxe=makeToolTex('#61e1e1','#7a5230','pick');
  TEX.woodAxe=makeToolTex('#a37431','#7a5230','axe');
  TEX.stoneAxe=makeToolTex('#8d8d8d','#7a5230','axe');
  TEX.ironAxe=makeToolTex('#c9c9c9','#7a5230','axe');
  TEX.goldAxe=makeToolTex('#f0c040','#7a5230','axe');
  TEX.diamondAxe=makeToolTex('#61e1e1','#7a5230','axe');
  TEX.woodBlade=makeToolTex('#a37431','#7a5230','blade');
  TEX.stoneBlade=makeToolTex('#8d8d8d','#7a5230','blade');
  TEX.ironBlade=makeToolTex('#c9c9c9','#7a5230','blade');
  TEX.goldBlade=makeToolTex('#f0c040','#7a5230','blade');
  TEX.diamondBlade=makeToolTex('#61e1e1','#7a5230','blade');
  TEX.boat=makeTex(g=>{
    g.fillStyle='#8a5b34';g.fillRect(2,7,12,6);
    g.fillStyle='#6f4628';g.fillRect(1,8,1,4);g.fillRect(14,8,1,4);
    g.fillStyle='#b07646';g.fillRect(4,6,8,1);
  });
  for(let i=0;i<WOOL_COLORS.length;i++){
    const id=WOOL_BASE_ID+i;
    const hex=WOOL_COLORS[i].hex;
    TEX[`wool_${id}`]=makeTex(g=>{
      g.fillStyle=hex;g.fillRect(0,0,16,16);
      const r=rng(300+i);
      for(let n=0;n<22;n++){
        const a=(r()*0.3)+0.08;
        g.fillStyle=`rgba(255,255,255,${a.toFixed(3)})`;
        g.fillRect((r()*15)|0,(r()*15)|0,2,1);
      }
    });
  }
   
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
     [B.CHEST]:{top:TEX.chestTop,bot:TEX.chestTop,side:TEX.chestSide},
     [B.IRON_CHEST]:{top:TEX.ironChest,bot:TEX.ironChest,side:TEX.ironChest},
     [B.GOLD_CHEST]:{top:TEX.goldChest,bot:TEX.goldChest,side:TEX.goldChest},
     [B.DIAMOND_CHEST]:{top:TEX.diamondChest,bot:TEX.diamondChest,side:TEX.diamondChest},
     [B.TNT]:{top:TEX.tntTop,bot:TEX.tntTop,side:TEX.tntSide},
     [B.IRON_BLOCK]:{top:TEX.ironBlock,bot:TEX.ironBlock,side:TEX.ironBlock},
     [B.GOLD_BLOCK]:{top:TEX.goldBlock,bot:TEX.goldBlock,side:TEX.goldBlock},
     [B.DIAMOND_BLOCK]:{top:TEX.diamondBlock,bot:TEX.diamondBlock,side:TEX.diamondBlock},
     [B.COBBLESTONE]:{top:TEX.cobblestone,bot:TEX.cobblestone,side:TEX.cobblestone},
     [B.RED_SAND]:{top:TEX.redSand,bot:TEX.redSand,side:TEX.redSand},
     [B.TORCH]:{top:TEX.torch,bot:TEX.torch,side:TEX.torch},
   };
   for(let i=0;i<WOOL_COLORS.length;i++){
    const id=WOOL_BASE_ID+i;
    BLOCK_TEX[id]={top:TEX[`wool_${id}`],bot:TEX[`wool_${id}`],side:TEX[`wool_${id}`]};
   }
   // Item icon textures (non-block)
   const ITEM_TEX={
     [IT.COAL]:TEX.coal,[IT.IRON_INGOT]:TEX.ironIngot,
     [IT.GOLD_INGOT]:TEX.goldIngot,[IT.DIAMOND]:TEX.diamond,
     [IT.STICK]:TEX.stick,[IT.WOOD_PICKAXE]:TEX.woodPickaxe,
     [IT.STONE_PICKAXE]:TEX.stonePickaxe,[IT.IRON_PICKAXE]:TEX.ironPickaxe,[IT.GOLD_PICKAXE]:TEX.goldPickaxe,[IT.DIAMOND_PICKAXE]:TEX.diamondPickaxe,
     [IT.WOOD_AXE]:TEX.woodAxe,[IT.STONE_AXE]:TEX.stoneAxe,[IT.IRON_AXE]:TEX.ironAxe,[IT.GOLD_AXE]:TEX.goldAxe,[IT.DIAMOND_AXE]:TEX.diamondAxe,
     [IT.WOOD_BLADE]:TEX.woodBlade,[IT.STONE_BLADE]:TEX.stoneBlade,[IT.IRON_BLADE]:TEX.ironBlade,[IT.GOLD_BLADE]:TEX.goldBlade,[IT.DIAMOND_BLADE]:TEX.diamondBlade,
     [IT.BOAT]:TEX.boat,
   };
   function getItemTex(id){
     if(id<100) return (BLOCK_TEX[id]||BLOCK_TEX[B.STONE]).top;
     return ITEM_TEX[id]||TEX.stone;
   }
   
   const matCache={};
   function getMats(id){
     if(matCache[id]) return matCache[id];
     const bt=BLOCK_TEX[id]||BLOCK_TEX[B.STONE];
     const tr=id===B.LEAVES||id===B.WATER||id===B.LAVA||id===B.TORCH;
    const op={transparent:tr,opacity:id===B.WATER?0.76:id===B.LEAVES?0.86:1,side:tr?THREE.DoubleSide:THREE.FrontSide,depthWrite:!tr,alphaTest:id===B.TORCH?0.08:0};
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
   function h2(x,z){
     const sx=x+(SEED_NORM*0.000013);
     const sz=z-(SEED_NORM*0.000017);
     return Math.sin(sx*127.1+sz*311.7+SEED_NORM*0.0019)*43758.5453;
   }
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
    const base=octNoise(wx*0.006,wz*0.006,6,2.0,0.55)*22;
    const detail=octNoise(wx*0.019+180,wz*0.019-90,3,2.0,0.48)*6;
    const ridge=(1-Math.abs(octNoise(wx*0.012+320,wz*0.012+45,4,2.05,0.52)))*8-4;
    const dist=Math.hypot(wx,wz);
    const centerLift=Math.max(0,1-dist/120)*8;
    const h=Math.round(CFG.seaLevel+base+detail+ridge+centerLift);
    return Math.max(3,Math.min(CFG.chunkH-2,h));
  }

  function ensureChunkGenerated(cx,cz){
    if(!getArr(cx,cz,false))generateChunk(cx,cz);
  }

  function getSurfaceY(wx,wz){
    const cx=Math.floor(wx/16),cz=Math.floor(wz/16);
    ensureChunkGenerated(cx,cz);
    for(let y=CFG.chunkH-2;y>=1;y--){
      const id=worldGet(wx,y,wz);
      if(!isSolid(id)||isFluid(id))continue;
      if(worldGet(wx,y+1,wz)===B.AIR&&worldGet(wx,y+2,wz)===B.AIR)return y;
    }
    return -1;
  }

  function findSafeSpawn(radius=100,ox=0,oz=0){
    let best=null;
    for(let r=0;r<=radius;r+=4){
      const circ=Math.max(8,Math.ceil((2*Math.PI*Math.max(r,1))/8));
      for(let i=0;i<circ;i++){
        const ang=(i/circ)*Math.PI*2;
        const wx=Math.round(ox+Math.cos(ang)*r);
        const wz=Math.round(oz+Math.sin(ang)*r);
        if(Math.hypot(wx-ox,wz-oz)>radius)continue;
        const y=getSurfaceY(wx,wz);
        if(y<=CFG.seaLevel+1)continue;
        const here=worldGet(wx,y,wz);
        if(here===B.WATER||here===B.LAVA)continue;
        const n1=getSurfaceY(wx+1,wz),n2=getSurfaceY(wx-1,wz),n3=getSurfaceY(wx,wz+1),n4=getSurfaceY(wx,wz-1);
        const steep=Math.max(Math.abs(n1-y),Math.abs(n2-y),Math.abs(n3-y),Math.abs(n4-y));
        if(steep>3)continue;
        const score=(y-CFG.seaLevel)*4-Math.hypot(wx-ox,wz-oz)-steep*6;
        if(!best||score>best.score)best={wx,wz,y,score};
      }
      if(best&&r>=20)break;
    }
    return best;
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
    return id!==B.AIR&&id!==B.LEAVES&&id!==B.WATER&&id!==B.LAVA&&id!==B.TORCH;
  }
   function isFluid(id){return id===B.WATER||id===B.LAVA;}
   
   // Ore vein generation
   function oreBlock(wx,wy,wz){
     const r=frac(Math.abs(h2(wx*7+wy,wz*13+wy*3)));
     // Coal: veins Y5-128 ~4.5%
    if(wy>=5&&wy<=128){const v=frac(Math.abs(h2(Math.floor(wx/3)*3,Math.floor(wz/3)*3+wy/3)));if(v<0.014)return B.COAL_ORE;}
     // Iron Y5-64 1.8%
    if(wy>=5&&wy<=64&&r>=0.014&&r<0.019)return B.IRON_ORE;
     // Gold Y5-32 0.8%
    if(wy>=5&&wy<=32&&r>=0.019&&r<0.0215)return B.GOLD_ORE;
     // Diamond Y1-16 0.4%
    if(wy>=1&&wy<=16&&r>=0.0215&&r<0.0226)return B.DIAMOND_ORE;
     return B.STONE;
   }
   
   // Cave carver
  function isCave(wx,wy,wz){
    if(wy<=2)return false;
    const curve=octNoise(wx*0.028+wz*0.011,wy*0.045+wz*0.019,3,2,0.55);
    const curve2=octNoise(wx*0.017-wz*0.022+130,wy*0.043+wx*0.014+70,3,2,0.55);
    if(curve*curve+curve2*curve2<0.032)return true;
    const conn=octNoise(wx*0.02+210,wz*0.02-90,2,2,0.5);
    if(Math.abs(conn)<0.06&&wy>8&&wy<80)return true;
    const ravine=getRavineProfile(wx,wz);
    if(ravine&&wy>ravine.bottom&&wy<ravine.top){
      const axisOff=ravine.orient==='x'?Math.abs(wz-ravine.axis):Math.abs(wx-ravine.axis);
      const width=ravine.half*(1-(wy-ravine.bottom)/(ravine.top-ravine.bottom)*0.35);
      if(axisOff<Math.max(1.2,width))return true;
    }
    return false;
  }
   
   // Tree variants
   function treeSize(wx,wz){
     const r=frac(Math.abs(h2(wx*5.3,wz*4.7)));
     if(r<0.3)return 'sm'; if(r<0.75)return 'md'; return 'lg';
   }
   function leavesQualityChance(){
     const q=CFG.leavesQuality;
     if(q==='low')return 0.4;
     if(q==='medium')return 0.7;
     if(q==='high')return 1.0;
     return 0.85;
   }

  function qualityFactor(mode){
    if(mode==='none')return 0;
    if(mode==='low')return 0.35;
    if(mode==='medium')return 0.7;
    if(mode==='high')return 1;
    return 0.55;
  }
  function particlesEnabled(){return qualityFactor(CFG.particlesMode)>0;}
  function particleCountScale(){return qualityFactor(CFG.particlesMode);}
  function cloudsEnabled(){return qualityFactor(CFG.cloudsMode)>0;}
  function cloudCountScale(){return qualityFactor(CFG.cloudsMode);}
  function shadowsEnabled(){return qualityFactor(CFG.shadowsMode)>0;}

  function getRavineProfile(wx,wz){
    const base=Math.floor(wx/8)*8;
    const baseZ=Math.floor(wz/8)*8;
    const seed=frac(Math.abs(h2(base+431,baseZ-219)));
    if(seed>=0.018)return null;
    const orient=seed<0.009?'x':'z';
    const axis=orient==='x'?Math.floor(baseZ/6)*6:Math.floor(base/6)*6;
    const widthN=frac(Math.abs(h2(base+777,baseZ+333)));
    const half=widthN<0.33?1.6:(widthN<0.76?2.4:3.4);
    const tallN=frac(Math.abs(h2(base-91,baseZ+517)));
    const top=tallN<0.2?34:(tallN<0.82?58:86);
    const depth=tallN<0.2?18:(tallN<0.82?34:54);
    const bottom=Math.max(8,top-depth);
    const flood=tallN>0.66?Math.min(top-6,CFG.seaLevel):null;
    return {orient,axis,half,top,bottom,flood};
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
         }
         else if(y<h){
           id=isCave(wx,y,wz)?B.AIR:B.DIRT;
         }
         else if(y===h){
           if(isCave(wx,y,wz))id=B.AIR;
           else if(h<=CFG.seaLevel-1)id=frac(Math.abs(h2(wx*0.31+19,wz*0.27-11)))<0.16?B.RED_SAND:B.SAND;
           else id=B.GRASS;
         }
         else if(y<=CFG.seaLevel&&h<CFG.seaLevel)id=B.WATER;
         const rav=getRavineProfile(wx,wz);
         if(rav&&id===B.AIR&&rav.flood!==null&&y<=rav.flood&&y>rav.bottom+2&&isCave(wx,y,wz))id=B.WATER;
         arr[vKey(lx,y,lz)]=id;
       }
   
       // Rare underground lava pocket with smoother curve (never above surface)
       if(h>40&&frac(Math.abs(h2(wx*1.7+44,wz*2.1+87)))<0.0007){
         const ly=Math.max(4,Math.min(h-6,8+((frac(Math.abs(h2(wx*4.1,wz*3.7)))*14)|0)));
         for(let dlx=-3;dlx<=3;dlx++)for(let dlz=-3;dlz<=3;dlz++){
           const nx=dlx/3,nz=dlz/3;
           const curve=nx*nx+nz*nz;
           if(curve>1)continue;
           const depth=curve<0.35?2:1;
           const lx2=lx+dlx,lz2=lz+dlz;
           if(lx2<0||lx2>=16||lz2<0||lz2>=16)continue;
           for(let d=0;d<depth;d++)arr[vKey(lx2,ly-d,lz2)]=B.LAVA;
           if(ly+1<CFG.chunkH)arr[vKey(lx2,ly+1,lz2)]=B.AIR;
         }
       }
   

      // Deep under-level flat cave lava spaces
      const flatMask=Math.abs(octNoise(wx*0.017+210,wz*0.017-140,3,2,0.5));
      if(flatMask<0.05&&h>26){
        const lavaY=6+((frac(Math.abs(h2(wx*1.2+77,wz*1.3-33)))*4)|0);
        for(let dlx=-4;dlx<=4;dlx++)for(let dlz=-4;dlz<=4;dlz++){
          const lx2=lx+dlx,lz2=lz+dlz;
          if(lx2<0||lx2>=16||lz2<0||lz2>=16)continue;
          const r=(dlx*dlx)/(4.8*4.8)+(dlz*dlz)/(4.2*4.2);
          if(r>1)continue;
          arr[vKey(lx2,lavaY,lz2)]=B.LAVA;
          for(let y=lavaY+1;y<=lavaY+4;y++)arr[vKey(lx2,y,lz2)]=B.AIR;
        }
      }

       // Oak tree

       const tdChance=0.02;
       if(h>CFG.seaLevel+1&&frac(Math.abs(h2(wx*3.1+1,wz*2.9+2)))<tdChance){
        const ground=arr[vKey(lx,h,lz)];
        if(!(ground===B.GRASS||ground===B.DIRT))continue;
         const sz=treeSize(wx,wz);
         const trunkH=sz==='sm'?3:sz==='md'?5:7;
         const leafR=sz==='sm'?2:sz==='md'?2:3;
         const leafH=sz==='sm'?3:sz==='md'?4:5;
         const base=h+1;
         for(let ty=base;ty<base+trunkH&&ty<CFG.chunkH;ty++)arr[vKey(lx,ty,lz)]=B.WOOD;
         for(let lfz=-leafR;lfz<=leafR;lfz++)for(let lfx=-leafR;lfx<=leafR;lfx++)for(let lft=leafH-3;lft<=leafH+1;lft++){
           const flx=lx+lfx,flz=lz+lfz,fly=base+trunkH-1+lft;
           if(flx>=0&&flx<16&&flz>=0&&flz<16&&fly<CFG.chunkH)
             if(arr[vKey(flx,fly,flz)]===B.AIR&&frac(Math.abs(h2(wx*13+lfx*7+fly,wz*11+lfz*5)))<leavesQualityChance())arr[vKey(flx,fly,flz)]=B.LEAVES;
         }
       }
     }
   }
   
   // ═══════════════════════════════════════════════════════════
   // 5.  CHUNK MESH BUILDER
   // ═══════════════════════════════════════════════════════════
   const chunkMeshes=new Map();
  const torchLights=new Map();
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
    for(const [k,l] of [...torchLights.entries()]){
      if(l.userData.chunkKey===key){scene.remove(l);torchLights.delete(k);}
    }
     const arr=getArr(cx,cz,false);if(!arr)return;
     const fd={};
     const getFD=id=>{if(!fd[id])fd[id]={pos:[],nor:[],uvs:[],idx:[]};return fd[id];};
     for(let lx=0;lx<16;lx++)for(let lz=0;lz<16;lz++)for(let y=0;y<CFG.chunkH;y++){
       const self=arr[vKey(lx,y,lz)];if(self===B.AIR)continue;
       const wx=cx*16+lx,wz=cz*16+lz;
       if(self===B.TORCH){
        const d=getFD(self),base=d.pos.length/3;
        const x0=lx+0.4,x1=lx+0.6,z0=lz+0.4,z1=lz+0.6,y0=y,y1=y+0.78;
        const verts=[
          [x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[x1,y0,z1],
          [x0,y0,z1],[x0,y1,z1],[x0,y1,z0],[x0,y0,z0],
          [x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0],
          [x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],
          [x1,y0,z1],[x1,y1,z1],[x0,y1,z1],[x0,y0,z1],
          [x0,y0,z0],[x0,y1,z0],[x1,y1,z0],[x1,y0,z0],
        ];
        const norms=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
        for(let f=0;f<6;f++){
          for(let i=0;i<4;i++){
            const v=verts[f*4+i];d.pos.push(v[0],v[1],v[2]);
            d.nor.push(...norms[f]);d.uvs.push(QUV[i][0],QUV[i][1]);
          }
          const fb=base+f*4;d.idx.push(fb,fb+1,fb+2,fb,fb+2,fb+3);
        }
        continue;
       }
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
       const sh=shadowsEnabled();mesh.castShadow=sh;mesh.receiveShadow=sh;
       grp.add(mesh);
     });
     scene.add(grp);chunkMeshes.set(key,grp);
    for(let lx=0;lx<16;lx++)for(let lz=0;lz<16;lz++)for(let y=1;y<CFG.chunkH;y++){
      if(arr[vKey(lx,y,lz)]!==B.TORCH)continue;
      const wx=cx*16+lx,wz=cz*16+lz;
      const lk=`${wx},${y},${wz}`;
      const light=new THREE.PointLight(0xffcb77,0.68,8,2.2);
      light.position.set(wx+0.5,y+0.58,wz+0.5);
      light.userData={chunkKey:key};
      scene.add(light);torchLights.set(lk,light);
    }
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
   for(let i=0;i<40;i++){
     const c=new THREE.Mesh(new THREE.BoxGeometry(5+Math.random()*9,1.5,3+Math.random()*4),cloudMat);
     c.position.set((Math.random()-0.5)*280,88+Math.random()*18,(Math.random()-0.5)*280);
     c.userData.spd=0.3+Math.random()*0.8;
     scene.add(c);clouds.push(c);
   }
   

  const worldBorderGroup=new THREE.Group();
  (function initWorldBorder(){
    const mat=new THREE.MeshBasicMaterial({color:0x3ba3ff,transparent:true,opacity:0.28,side:THREE.DoubleSide});
    const h=CFG.chunkH;
    const span=WORLD_BORDER_BLOCKS*2;
    const thick=0.8;
    const wallN=new THREE.Mesh(new THREE.BoxGeometry(span,h,thick),mat);
    const wallS=wallN.clone();
    const wallE=new THREE.Mesh(new THREE.BoxGeometry(thick,h,span),mat);
    const wallW=wallE.clone();
    wallN.position.set(0,h*0.5,WORLD_BORDER_BLOCKS+0.5);
    wallS.position.set(0,h*0.5,-WORLD_BORDER_BLOCKS-0.5);
    wallE.position.set(WORLD_BORDER_BLOCKS+0.5,h*0.5,0);
    wallW.position.set(-WORLD_BORDER_BLOCKS-0.5,h*0.5,0);
    worldBorderGroup.add(wallN,wallS,wallE,wallW);
    scene.add(worldBorderGroup);
  })();

   // ═══════════════════════════════════════════════════════════
   // 8.  PLAYER (survival: gravity, jump, collision)
   // ═══════════════════════════════════════════════════════════
   const player={
     pos:new THREE.Vector3(8,70,8),
     vel:new THREE.Vector3(0,0,0),
     yaw:0,pitch:0,pitchMax:Math.PI/2-0.01,
     onGround:false,
     width:0.6,height:1.8,standHeight:1.8,sneakHeight:1.5,
     eyeOffset:1.62,standEyeOffset:1.62,sneakEyeOffset:1.32,
   };
   const boats=[];
   let ridingBoat=null;

  function spawnBoat(wx,wy,wz,yaw=0){
    const hull=new THREE.Mesh(new THREE.BoxGeometry(1.28,0.42,2.08),new THREE.MeshLambertMaterial({map:TEX.boat,color:0xffffff}));
    hull.position.set(wx+0.5,wy+0.35,wz+0.5);
    hull.rotation.y=yaw;
    hull.userData={vx:0,vz:0,vy:0,hp:20,riders:0,maxRiders:2,spanX:Math.abs(Math.round(Math.sin(yaw))),spanZ:Math.abs(Math.round(Math.cos(yaw)))};
    scene.add(hull);
    boats.push(hull);
    return hull;
   }
   function nearestBoat(maxDist=3.2){
    let best=null,bestD=maxDist;
    for(const b of boats){
      const d=b.position.distanceTo(camera.position);
      if(d<bestD){best=b;bestD=d;}
    }
    return best;
   }
  function tryUseBoat(){
    if(ridingBoat){dismountBoat();return true;}
    return mountNearestBoat();
  }
  function mountNearestBoat(){
    const b=nearestBoat(3.4);
    if(!b)return false;
    if((b.userData.riders||0)>=(b.userData.maxRiders||2))return false;
    ridingBoat=b;
    b.userData.riders=(b.userData.riders||0)+1;
    player.onGround=true;
    return true;
  }
  function dismountBoat(){
    if(!ridingBoat)return;
    const off=new THREE.Vector3(Math.sin(player.yaw),0,Math.cos(player.yaw)).multiplyScalar(1.2);
    player.pos.set(ridingBoat.position.x+off.x,ridingBoat.position.y+0.2,ridingBoat.position.z+off.z);
    ridingBoat.userData.riders=Math.max(0,(ridingBoat.userData.riders||1)-1);
    ridingBoat=null;
  }
  function destroyBoat(boat){
    if(!boat)return;
    if(ridingBoat===boat)ridingBoat=null;
    boat.userData.riders=0;
    const i=boats.indexOf(boat);
    if(i>=0)boats.splice(i,1);
    spawnDropStack(Math.floor(boat.position.x),Math.floor(boat.position.y),Math.floor(boat.position.z),IT.BOAT,1,0.2);
    scene.remove(boat);boat.geometry.dispose();boat.material.dispose();
   }
   function tryHitBoat(){
     const b=nearestBoat(3.0);
     if(!b)return false;
    consumeHeldToolDurability(1);
     b.userData.hp=Math.max(0,(b.userData.hp||20)-getAttackDamage());
     b.material.color.setHex(b.userData.hp<=8?0xffcaca:0xffffff);
     if(b.userData.hp<=0)destroyBoat(b);
     return true;
   }
   camera.position.copy(player.pos);
   
   // Pointer lock
   canvas.addEventListener('click',()=>{if(!document.pointerLockElement)canvas.requestPointerLock();});
  document.addEventListener('pointerlockchange',()=>{
     const locked=!!document.pointerLockElement;
     document.getElementById('crosshair').style.display=locked?'block':'none';
     const inGame=document.getElementById('game-ui').style.display==='block';
     if(!locked&&inGame&&!isInvOpen&&!isPaused&&!isChatOpen&&document.getElementById('settings-menu').style.display!=='flex'){
       isPaused=true;
       document.getElementById('pause-menu').style.display='flex';
     }
   });
   document.addEventListener('mousemove',e=>{
     if(!document.pointerLockElement||isPaused||isInvOpen||isChatOpen)return;
     player.yaw  -=e.movementX*CFG.mouseSens;
     player.pitch-=e.movementY*CFG.mouseSens;
     player.pitch=Math.max(-player.pitchMax,Math.min(player.pitchMax,player.pitch));
   });
   
  const KEYS={};
  const PHYS_KEYS={};
  let wLastTap=0,sprintTap=false,showHud=true,isChatOpen=false;
  const CHAT={messages:[],maxLines:9};
  const TOUCH={
    enabled:false,
    keySources:new Map(),
    lookTouchId:null,lastLookX:0,lastLookY:0,
    forceSprint:false,forceSneak:false,
  };
  const CONTROLLER={
    active:false,
    prevButtons:[],
  };

  function isShiftDown(){return !!(KEYS['ShiftLeft']||KEYS['ShiftRight']);}
  function setVirtualKey(code,source,pressed){
    if(!TOUCH.keySources.has(code))TOUCH.keySources.set(code,new Set());
    const set=TOUCH.keySources.get(code);
    if(pressed)set.add(source);else set.delete(source);
    KEYS[code]=!!PHYS_KEYS[code]||set.size>0;
  }
  function clearMovementKeys(){
    ['KeyW','KeyA','KeyS','KeyD','Space','ShiftLeft','ShiftRight','ControlLeft'].forEach(k=>{
      PHYS_KEYS[k]=false;
      if(TOUCH.keySources.has(k))TOUCH.keySources.get(k).clear();
      KEYS[k]=false;
    });
  }
  function renderChatLog(){
    const log=document.getElementById('chat-log');
    log.innerHTML='';
    CHAT.messages.forEach(msg=>{
      const line=document.createElement('div');
      line.className='chat-line';
      line.textContent=msg;
      log.appendChild(line);
    });
    log.scrollTop=log.scrollHeight;
  }
  function pushChatMessage(msg){
    const text=(msg||'').trim();
    if(!text)return;
    CHAT.messages.push(text);
    while(CHAT.messages.length>CHAT.maxLines)CHAT.messages.shift();
    renderChatLog();
  }
  function trySendChatMessage(){
    const input=document.getElementById('chat-input');
    const text=input.value.trim();
    if(!text)return;
    pushChatMessage(`You: ${text}`);
    closeChat();
  }
  function closeChat(){
    isChatOpen=false;
    const panel=document.getElementById('chat-panel');
    panel.style.display='none';
    const input=document.getElementById('chat-input');
    input.value='';
    input.blur();
    if(document.getElementById('game-ui').style.display==='block'&&!isPaused&&!isInvOpen&&document.getElementById('settings-menu').style.display!=='flex'){
      canvas.requestPointerLock();
    }
  }
  function openChat(){
    if(isPaused||isInvOpen||document.getElementById('settings-menu').style.display==='flex')return;
    isChatOpen=true;
    clearMovementKeys();
    document.getElementById('chat-panel').style.display='flex';
    renderChatLog();
    if(document.pointerLockElement)document.exitPointerLock();
    document.getElementById('chat-input').focus();
  }

  window.addEventListener('keydown',e=>{
    if(isChatOpen){
      if(e.code==='Escape'){e.preventDefault();closeChat();}
      return;
    }
    PHYS_KEYS[e.code]=true;
    KEYS[e.code]=true;
    if(['Space','ArrowUp','ArrowDown'].includes(e.code))e.preventDefault();
    if(e.code.startsWith('Digit')){const n=parseInt(e.code.slice(5))-1;if(n>=0&&n<9){INV.active=n;updateHotbarUI();drawHand();}}
    if(e.code==='KeyP')togglePause();
    if(e.code==='KeyE')toggleInventory();
    if(e.code==='KeyT'){e.preventDefault();openChat();return;}
    if(e.code==='KeyF'){e.preventDefault();if(ridingBoat)dismountBoat();else mountNearestBoat();return;}
    if(e.code==='KeyH'){showHud=!showHud;document.getElementById('hud').style.display=showHud?'block':'none';}
     if(e.code==='KeyW'&&!e.repeat){
       const now=performance.now()*0.001;
       if(now-wLastTap<0.3)sprintTap=true;
       wLastTap=now;
     }
  });
  window.addEventListener('keyup',e=>{
    PHYS_KEYS[e.code]=false;
    const virtualCount=TOUCH.keySources.get(e.code)?.size||0;
    KEYS[e.code]=virtualCount>0;
    if(e.code==='KeyW')sprintTap=false;
  });
  document.getElementById('chat-input').addEventListener('keydown',e=>{
    if(e.code==='Enter'){
      e.preventDefault();
      trySendChatMessage();
      return;
    }
    if(e.code==='Escape'){
      e.preventDefault();
      closeChat();
    }
  });
  document.getElementById('chat-send').addEventListener('click',trySendChatMessage);

  function applyTouchControllerVisibility(){
    const show=!!CFG.enableCubenixMobile;
    document.getElementById('touch-ui').style.display=show?'block':'none';
    TOUCH.enabled=show;
    if(!show){
      ['KeyW','KeyA','KeyS','KeyD','Space','ShiftLeft'].forEach(k=>setVirtualKey(k,'touch',false));
      TOUCH.forceSprint=false;TOUCH.forceSneak=false;
      document.getElementById('touch-sprint')?.classList.remove('active');
      document.getElementById('touch-sneak')?.classList.remove('active');
      stopBreaking();
    }
  }

  function bindTouchButton(id,code){
    const el=document.getElementById(id);
    if(!el)return;
    el.addEventListener('touchstart',e=>{e.preventDefault();setVirtualKey(code,'touch',true);},{passive:false});
    el.addEventListener('touchend',e=>{e.preventDefault();setVirtualKey(code,'touch',false);},{passive:false});
    el.addEventListener('touchcancel',e=>{e.preventDefault();setVirtualKey(code,'touch',false);},{passive:false});
  }

  function setupTouchControls(){
    bindTouchButton('touch-forward','KeyW');
    bindTouchButton('touch-left','KeyA');
    bindTouchButton('touch-back','KeyS');
    bindTouchButton('touch-right','KeyD');
    bindTouchButton('touch-jump','Space');
    const sneakBtn=document.getElementById('touch-sneak');
    const sprintBtn=document.getElementById('touch-sprint');
    sneakBtn?.addEventListener('touchstart',e=>{e.preventDefault();TOUCH.forceSneak=!TOUCH.forceSneak;if(TOUCH.forceSneak)TOUCH.forceSprint=false;sneakBtn.classList.toggle('active',TOUCH.forceSneak);sprintBtn?.classList.toggle('active',TOUCH.forceSprint);},{passive:false});
    sprintBtn?.addEventListener('touchstart',e=>{e.preventDefault();TOUCH.forceSprint=!TOUCH.forceSprint;if(TOUCH.forceSprint)TOUCH.forceSneak=false;sprintBtn.classList.toggle('active',TOUCH.forceSprint);sneakBtn?.classList.toggle('active',TOUCH.forceSneak);},{passive:false});

    const breakBtn=document.getElementById('touch-break');
    breakBtn.addEventListener('touchstart',e=>{e.preventDefault();if(!isPaused&&!isInvOpen)startBreaking();},{passive:false});
    breakBtn.addEventListener('touchend',e=>{e.preventDefault();stopBreaking();},{passive:false});
    breakBtn.addEventListener('touchcancel',e=>{e.preventDefault();stopBreaking();},{passive:false});

    const placeBtn=document.getElementById('touch-place');
    placeBtn.addEventListener('touchstart',e=>{
      e.preventDefault();
      if(isPaused||isInvOpen)return;
      if(!tryOpenInteractable())placeBlock();
    },{passive:false});

    const gameUi=document.getElementById('game-ui');
    gameUi.addEventListener('touchstart',e=>{
      if(!TOUCH.enabled||isPaused||isInvOpen||isChatOpen)return;
      for(const t of e.changedTouches){
        if(t.clientX<window.innerWidth*0.55)continue;
        if(TOUCH.lookTouchId!==null)continue;
        TOUCH.lookTouchId=t.identifier;
        TOUCH.lastLookX=t.clientX;TOUCH.lastLookY=t.clientY;
      }
    },{passive:true});
    gameUi.addEventListener('touchmove',e=>{
      if(!TOUCH.enabled||TOUCH.lookTouchId===null||isPaused||isInvOpen||isChatOpen)return;
      for(const t of e.changedTouches){
        if(t.identifier!==TOUCH.lookTouchId)continue;
        const dx=t.clientX-TOUCH.lastLookX;
        const dy=t.clientY-TOUCH.lastLookY;
        TOUCH.lastLookX=t.clientX;TOUCH.lastLookY=t.clientY;
        const ts=Math.max(0.4,Math.min(2.5,CFG.touchLookSens||1));
        player.yaw-=dx*CFG.mouseSens*0.75*ts;
        player.pitch-=dy*CFG.mouseSens*0.75*ts;
        player.pitch=Math.max(-player.pitchMax,Math.min(player.pitchMax,player.pitch));
      }
    },{passive:true});
    gameUi.addEventListener('touchend',e=>{
      for(const t of e.changedTouches){
        if(t.identifier===TOUCH.lookTouchId)TOUCH.lookTouchId=null;
      }
    },{passive:true});
    gameUi.addEventListener('touchcancel',e=>{
      for(const t of e.changedTouches){
        if(t.identifier===TOUCH.lookTouchId)TOUCH.lookTouchId=null;
      }
    },{passive:true});
  }

  function updateControllerInput(){
    if(!CFG.enableCubenixConnect)return;
    const pads=navigator.getGamepads?.()||[];
    const gp=[...pads].find(Boolean);
    CONTROLLER.active=!!gp;
    if(!gp)return;
    const ax0=gp.axes?.[0]||0,ax1=gp.axes?.[1]||0,ax2=gp.axes?.[2]||0,ax3=gp.axes?.[3]||0;
    const dead=0.2;
    setVirtualKey('KeyA','pad',ax0<-dead);
    setVirtualKey('KeyD','pad',ax0>dead);
    setVirtualKey('KeyW','pad',ax1<-dead);
    setVirtualKey('KeyS','pad',ax1>dead);
    if(Math.abs(ax2)>dead){player.yaw-=ax2*CFG.mouseSens*35;}
    if(Math.abs(ax3)>dead){
      player.pitch-=ax3*CFG.mouseSens*35;
      player.pitch=Math.max(-player.pitchMax,Math.min(player.pitchMax,player.pitch));
    }
    const jump=gp.buttons?.[0]?.pressed||false;
    const sneak=gp.buttons?.[1]?.pressed||false;
    const openChatBtn=gp.buttons?.[3]?.pressed||false;
    const rideBtn=gp.buttons?.[4]?.pressed||false;
    const breakBtn=gp.buttons?.[6]?.pressed||false;
    const placeBtn=gp.buttons?.[7]?.pressed||false;
    setVirtualKey('Space','pad',jump);
    setVirtualKey('ShiftLeft','pad',sneak);
    if(openChatBtn&&!CONTROLLER.prevButtons[3])openChat();
    if(rideBtn&&!CONTROLLER.prevButtons[4]){if(ridingBoat)dismountBoat();else mountNearestBoat();}
    if(breakBtn&&!CONTROLLER.prevButtons[6])startBreaking();
    if(!breakBtn&&CONTROLLER.prevButtons[6])stopBreaking();
    if(placeBtn&&!CONTROLLER.prevButtons[7]){if(!tryOpenInteractable())placeBlock();}
    CONTROLLER.prevButtons[3]=openChatBtn;
    CONTROLLER.prevButtons[4]=rideBtn;
    CONTROLLER.prevButtons[6]=breakBtn;
    CONTROLLER.prevButtons[7]=placeBtn;
  }

  setupTouchControls();
   
   // ── AABB collision sweep ──────────────────────────────────
  function getAABBBlocks(px,py,pz){
    // Check all blocks overlapping player AABB
    const w=player.width/2;
    const results=[];
    for(let ix=Math.floor(px-w);ix<=Math.floor(px+w);ix++)
    for(let iy=Math.floor(py);iy<=Math.floor(py+player.height-0.001);iy++)
    for(let iz=Math.floor(pz-w);iz<=Math.floor(pz+w);iz++){
      const b=worldGet(ix,iy,iz);
      if(isSolid(b))results.push({ix,iy,iz});
    }
    return results;
  }
   
  function resolveCollision(pos,vel,stepDt){
    const w=player.width/2;
     // Y axis
     pos.y+=vel.y*stepDt;
     const blocksY=getAABBBlocks(pos.x,pos.y,pos.z);
     for(const {iy} of blocksY){
       if(vel.y<0){const floor=iy+1;if(pos.y<floor){pos.y=floor;vel.y=0;player.onGround=true;}}
       else if(vel.y>0){const ceil=iy;if(pos.y+player.height>ceil){pos.y=ceil-player.height;vel.y=0;}}
     }
     // X axis
    const oldX=pos.x;
    pos.x+=vel.x*stepDt;
    for(const {ix,iy,iz} of getAABBBlocks(pos.x,pos.y,pos.z)){
      if((vel.x>0&&pos.x+w>ix)||(vel.x<0&&pos.x-w<ix+1)){pos.x=oldX;vel.x=0;break;}
    }
    // Z axis
    const oldZ=pos.z;
    pos.z+=vel.z*stepDt;
    for(const {ix,iy,iz} of getAABBBlocks(pos.x,pos.y,pos.z)){
      if((vel.z>0&&pos.z+w>iz)||(vel.z<0&&pos.z-w<iz+1)){pos.z=oldZ;vel.z=0;break;}
    }
  }
   
  const vF=new THREE.Vector3(),vR=new THREE.Vector3();
  let isPaused=false,isInvOpen=false;
  let waterContactT=0,lavaContactT=0;

  function playerBodyFluid(){
    const bx=Math.floor(player.pos.x),bz=Math.floor(player.pos.z);
    for(let y=Math.floor(player.pos.y);y<=Math.floor(player.pos.y+player.height);y++){
      const id=worldGet(bx,y,bz);
      if(id===B.WATER||id===B.LAVA)return id;
    }
    return B.AIR;
  }

  function spawnContactParticle(color,spread=0.35){
    const p=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.06,0.06),new THREE.MeshLambertMaterial({color}));
    p.position.set(player.pos.x+(Math.random()-0.5)*spread,player.pos.y+0.15+Math.random()*1.2,player.pos.z+(Math.random()-0.5)*spread);
    p.userData={vel:new THREE.Vector3((Math.random()-0.5)*0.8,Math.random()*0.9,(Math.random()-0.5)*0.8),life:0.5};
    scene.add(p);particles.push(p);
  }
   


  function unphasePlayerIfNeeded(){
    const w=player.width/2;
    let guard=0;
    while(guard<6){
      let stuck=false;
      for(let ix=Math.floor(player.pos.x-w);ix<=Math.floor(player.pos.x+w);ix++)
      for(let iy=Math.floor(player.pos.y);iy<=Math.floor(player.pos.y+player.height-0.001);iy++)
      for(let iz=Math.floor(player.pos.z-w);iz<=Math.floor(player.pos.z+w);iz++){
        if(isSolid(worldGet(ix,iy,iz))){stuck=true;break;}
      }
      if(!stuck)break;
      player.pos.y+=0.12;
      player.vel.y=Math.max(0,player.vel.y);
      guard++;
    }
  }

  function hasHeadroomForHeight(targetHeight){
    const w=player.width/2;
    for(let ix=Math.floor(player.pos.x-w);ix<=Math.floor(player.pos.x+w);ix++)
    for(let iy=Math.floor(player.pos.y);iy<=Math.floor(player.pos.y+targetHeight-0.001);iy++)
    for(let iz=Math.floor(player.pos.z-w);iz<=Math.floor(player.pos.z+w);iz++){
      if(isSolid(worldGet(ix,iy,iz)))return false;
    }
    return true;
  }

  function updatePlayerStance(){
    if(isShiftDown()){
      player.height=player.sneakHeight;
      player.eyeOffset=player.sneakEyeOffset;
      return;
    }
    if(player.height!==player.standHeight&&hasHeadroomForHeight(player.standHeight)){
      player.height=player.standHeight;
      player.eyeOffset=player.standEyeOffset;
    }
  }

  function movePlayer(dt){
     if(isPaused||isInvOpen||isChatOpen)return;
     if(ridingBoat){
      const boat=ridingBoat;
      const onWater=worldGet(Math.floor(boat.position.x),Math.floor(boat.position.y-0.2),Math.floor(boat.position.z))===B.WATER;
      const accel=onWater?22:6;
      const maxSpd=onWater?12.5:3.1;
      const drag=onWater?0.94:0.8;
      let drive=0;
      if(KEYS['KeyW'])drive+=1;
      if(KEYS['KeyS'])drive-=0.55;
      if(KEYS['KeyA'])player.yaw+=dt*(onWater?1.9:1.1);
      if(KEYS['KeyD'])player.yaw-=dt*(onWater?1.9:1.1);
      boat.userData.vx=(boat.userData.vx+(-Math.sin(player.yaw))*drive*accel*dt)*drag;
      boat.userData.vz=(boat.userData.vz+(-Math.cos(player.yaw))*drive*accel*dt)*drag;
      const vLen=Math.hypot(boat.userData.vx,boat.userData.vz);
      if(vLen>maxSpd){const s=maxSpd/vLen;boat.userData.vx*=s;boat.userData.vz*=s;}
      boat.position.x+=boat.userData.vx*dt;
      boat.position.z+=boat.userData.vz*dt;
      const fx=Math.floor(boat.position.x),fz=Math.floor(boat.position.z);
      const waterHere=worldGet(fx,Math.floor(boat.position.y-0.25),fz)===B.WATER||worldGet(fx,Math.floor(boat.position.y-0.95),fz)===B.WATER;
      if(waterHere){boat.position.y=Math.max(boat.position.y,Math.floor(boat.position.y)+0.35);boat.userData.vy=(boat.userData.vy||0)*0.65;}
      else{boat.userData.vy=Math.max(-6,(boat.userData.vy||0)-14*dt);boat.position.y+=boat.userData.vy*dt;}
      const by=Math.floor(boat.position.y-0.5);
      if(!onWater&&isSolid(worldGet(fx,by,fz))){boat.userData.vx*=0.5;boat.userData.vz*=0.5;boat.userData.vy=Math.max(0,boat.userData.vy||0);}
      player.pos.set(boat.position.x,boat.position.y+0.15,boat.position.z);
      player.vel.set(0,0,0);
      camera.position.set(player.pos.x,player.pos.y+player.standEyeOffset,player.pos.z);
      camera.rotation.order='YXZ';camera.rotation.y=player.yaw;camera.rotation.x=player.pitch;camera.rotation.z=0;
      return;
     }
     if(TOUCH.forceSneak)setVirtualKey('ShiftLeft','touch-force',true);
     else setVirtualKey('ShiftLeft','touch-force',false);
     updatePlayerStance();
     const sneaking=player.height===player.sneakHeight||TOUCH.forceSneak;
     const sprint=(TOUCH.forceSprint||(sprintTap&&KEYS['KeyW']))&&!KEYS['KeyS']&&!sneaking&&STATS.energy>0;
     const spd=sneaking?CFG.sneakSpeed:(sprint?CFG.sprintSpeed:CFG.walkSpeed);
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
     else if(CFG.autoJump&&player.onGround&&KEYS['KeyW']&&!KEYS['KeyS']){
       const fx=-Math.sin(player.yaw),fz=-Math.cos(player.yaw);
       const tx=Math.floor(player.pos.x+fx*0.6),tz=Math.floor(player.pos.z+fz*0.6),ty=Math.floor(player.pos.y);
       const stepSolid=isSolid(worldGet(tx,ty,tz));
       const aboveFree=!isSolid(worldGet(tx,ty+1,tz))&&!isSolid(worldGet(tx,ty+2,tz));
       if(stepSolid&&aboveFree){player.vel.y=CFG.jumpVel*0.98;player.onGround=false;}
     }
     const bodyFluid=playerBodyFluid();
     // Gravity / buoyancy
     if(bodyFluid===B.WATER){
       player.vel.y+=(2.7-(isShiftDown()?1.2:0))*dt;
       player.vel.y-=CFG.gravity*0.22*dt;
       if(KEYS['Space'])player.vel.y=Math.min(player.vel.y+11*dt,3.6);
       player.vel.x*=0.7;player.vel.z*=0.7;
     }else if(bodyFluid===B.LAVA){
       player.vel.y+=(1.8-(isShiftDown()?0.8:0))*dt;
       player.vel.y-=CFG.gravity*0.3*dt;
       if(KEYS['Space'])player.vel.y=Math.min(player.vel.y+9*dt,2.8);
       player.vel.x*=0.55;player.vel.z*=0.55;
     }else if(!player.onGround)player.vel.y-=CFG.gravity*dt;
     player.onGround=false;
     // Resolve collision per sub-step
     const steps=3;
     const stepDt=dt/steps;
     for(let s=0;s<steps;s++)resolveCollision(player.pos,player.vel,stepDt);
    unphasePlayerIfNeeded();

    const borderClamp=WORLD_BORDER_BLOCKS-0.35;
    if(player.pos.x>borderClamp){player.pos.x=borderClamp;player.vel.x=Math.min(0,player.vel.x);} 
    else if(player.pos.x<-borderClamp){player.pos.x=-borderClamp;player.vel.x=Math.max(0,player.vel.x);} 
    if(player.pos.z>borderClamp){player.pos.z=borderClamp;player.vel.z=Math.min(0,player.vel.z);} 
    else if(player.pos.z<-borderClamp){player.pos.z=-borderClamp;player.vel.z=Math.max(0,player.vel.z);} 
   
     // Energy
    if(sprint&&KEYS['KeyW']){
      STATS.energy=Math.max(0,STATS.energy-CFG.sprintEnergyDrain*dt);
    } else {
      STATS.energy=Math.min(STATS.maxEnergy,STATS.energy+7*dt);
    }

    if(player.pos.y<0){
      const voidDamageRate=STATS.maxHealth*0.20;
      STATS.health=Math.max(0,STATS.health-voidDamageRate*dt);
    }

    const headY=Math.floor(player.pos.y+player.eyeOffset);
    const headBlock=worldGet(Math.floor(player.pos.x),headY,Math.floor(player.pos.z));
    if(headBlock===B.WATER){
      // ~13.3 seconds to fully deplete from 100 air while submerged
      STATS.air=Math.max(0,STATS.air-7.5*dt);
      if(STATS.air<=0)STATS.health=Math.max(0,STATS.health-12*dt);
    }else{
      STATS.air=Math.min(STATS.maxAir,STATS.air+45*dt);
    }

    if(bodyFluid===B.WATER){
      waterContactT+=dt;
      if(waterContactT>0.08){waterContactT=0;spawnContactParticle(0x66bbff,0.55);}
    }else waterContactT=0;

    if(bodyFluid===B.LAVA){
      STATS.health=Math.max(0,STATS.health-18*dt);
      lavaContactT+=dt;
      if(lavaContactT>0.11){lavaContactT=0;spawnContactParticle(0xff5500,0.45);spawnContactParticle(0xffaa33,0.4);}
    }else lavaContactT=0;

    camera.position.set(player.pos.x,player.pos.y+player.eyeOffset,player.pos.z);
     camera.rotation.order='YXZ';camera.rotation.y=player.yaw;camera.rotation.x=player.pitch;camera.rotation.z=0;
   }
   
  // ── Sand/gravel gravity ──────────────────────────────────
  const FALLING_BLOCKS=[B.SAND,B.GRAVEL,B.RED_SAND];
  const fallingBlockEntities=[];
  const fallingBlockKeys=new Set();

  function updateFallingBlocks(){
     // Check blocks in loaded chunks for unsupported sand/gravel
     // (lightweight: only check near player)
     const px=Math.floor(player.pos.x),py=Math.floor(player.pos.y),pz=Math.floor(player.pos.z);
     for(let dx=-8;dx<=8;dx++)for(let dz=-8;dz<=8;dz++)for(let dy=CFG.seaLevel+5;dy>=1;dy--){
       const b=worldGet(px+dx,py+dy,pz+dz);
      if(FALLING_BLOCKS.includes(b)&&worldGet(px+dx,py+dy-1,pz+dz)===B.AIR){
        const wx=px+dx,wy=py+dy,wz=pz+dz;
        const key=`${wx},${wy},${wz}`;
        if(fallingBlockKeys.has(key))continue;
        fallingBlockKeys.add(key);
        worldSet(wx,wy,wz,B.AIR);
        const mesh=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),getMats(b));
        mesh.position.set(wx+0.5,wy+0.5,wz+0.5);
        mesh.userData={id:b,v:0,wx,wz,key};
        scene.add(mesh);
        fallingBlockEntities.push(mesh);
        buildChunkMesh(Math.floor(wx/16),Math.floor(wz/16));
      }
    }
  }

  function updateFallingEntities(dt){
    for(let i=fallingBlockEntities.length-1;i>=0;i--){
      const e=fallingBlockEntities[i];
      e.userData.v=Math.min(18,e.userData.v+30*dt);
      e.position.y-=e.userData.v*dt;
      const by=Math.floor(e.position.y-0.5);
      if(by<=0||worldGet(e.userData.wx,by,e.userData.wz)!==B.AIR){
        const y=Math.max(1,by+1);
        worldSet(e.userData.wx,y,e.userData.wz,e.userData.id);
        buildChunkMesh(Math.floor(e.userData.wx/16),Math.floor(e.userData.wz/16));
        fallingBlockKeys.delete(e.userData.key);
        scene.remove(e);e.geometry.dispose();
        fallingBlockEntities.splice(i,1);
      }
    }
  }

  function flowFluidOnce(fluidId,range=12){
    const px=Math.floor(player.pos.x),py=Math.floor(player.pos.y),pz=Math.floor(player.pos.z);
    const changes=[];
    const queued=new Set();
    const queueChange=(wx,wy,wz,id)=>{
      const k=`${wx},${wy},${wz}`;
      if(queued.has(k))return;
      queued.add(k);
      changes.push([wx,wy,wz,id]);
    };
    const maxChanges=fluidId===B.LAVA?10:24;
    for(let dx=-range;dx<=range;dx++)for(let dz=-range;dz<=range;dz++)for(let dy=8;dy>=-12;dy--){
      if(changes.length>=maxChanges)break;
      const wx=px+dx,wy=py+dy,wz=pz+dz;
      if(worldGet(wx,wy,wz)!==fluidId)continue;
      if(worldGet(wx,wy-1,wz)===B.AIR){queueChange(wx,wy-1,wz,fluidId);continue;}
      const dirs=[[1,0],[-1,0],[0,1],[0,-1]].sort(()=>Math.random()-0.5);
      for(const [sx,sz] of dirs){
        if(changes.length>=maxChanges)break;
        if(worldGet(wx+sx,wy,wz+sz)!==B.AIR||worldGet(wx+sx,wy-1,wz+sz)===B.AIR)continue;
        const curveN=frac(Math.abs(h2((wx+sx)*0.7+(fluidId*33), (wz+sz)*0.7-(wy*0.25))));
        const spreadChance=fluidId===B.LAVA?0.35:0.72;
        if(curveN>spreadChance)continue;
        if(fluidId===B.LAVA){
          const support=[worldGet(wx+sx+1,wy,wz+sz),worldGet(wx+sx-1,wy,wz+sz),worldGet(wx+sx,wy,wz+sz+1),worldGet(wx+sx,wy,wz+sz-1)].filter(isSolid).length;
          if(support<2)continue;
        }
        queueChange(wx+sx,wy,wz+sz,fluidId);
      }

      // Corner rounding pass: fill diagonal pockets between two touching fluid sides.
      const corners=[
        [[1,0],[0,1]],[[1,0],[0,-1]],[[-1,0],[0,1]],[[-1,0],[0,-1]],
      ];
      for(const [[ax,az],[bx,bz]] of corners){
        if(changes.length>=maxChanges)break;
        const tx=wx+ax+bx,tz=wz+az+bz;
        if(worldGet(tx,wy,tz)!==B.AIR||worldGet(tx,wy-1,tz)===B.AIR)continue;
        if(worldGet(wx+ax,wy,wz+az)!==fluidId||worldGet(wx+bx,wy,wz+bz)!==fluidId)continue;
        const cornerN=frac(Math.abs(h2(tx*1.13+wy*0.37,tz*1.09-fluidId)));
        const cornerChance=fluidId===B.LAVA?0.26:0.52;
        if(cornerN>cornerChance)continue;
        queueChange(tx,wy,tz,fluidId);
      }
    }
    for(const [wx,wy,wz,id] of changes){
      const opposite=id===B.WATER?B.LAVA:(id===B.LAVA?B.WATER:B.AIR);
      const nearOpp=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]].some(([dx,dy,dz])=>worldGet(wx+dx,wy+dy,wz+dz)===opposite);
      worldSet(wx,wy,wz,nearOpp?B.COBBLESTONE:id);
      buildChunkMesh(Math.floor(wx/16),Math.floor(wz/16));
    }
  }

  function hasWoodOrLeavesNeighbor(wx,wy,wz){
    const N=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
    for(const [dx,dy,dz] of N){
      const id=worldGet(wx+dx,wy+dy,wz+dz);
      if(id===B.WOOD||id===B.LEAVES)return true;
    }
    return false;
  }
  function hasWoodNearby(wx,wy,wz,r=3){
    for(let dx=-r;dx<=r;dx++)for(let dy=-r;dy<=r;dy++)for(let dz=-r;dz<=r;dz++){
      if(worldGet(wx+dx,wy+dy,wz+dz)===B.WOOD)return true;
    }
    return false;
  }
  function updateLeavesDecay(dt){
    const px=Math.floor(player.pos.x),py=Math.floor(player.pos.y),pz=Math.floor(player.pos.z);
    const tries=Math.max(8,Math.floor(dt*220));
    for(let i=0;i<tries;i++){
      const wx=px+((Math.random()*32)|0)-16;
      const wy=py+((Math.random()*24)|0)-10;
      const wz=pz+((Math.random()*32)|0)-16;
      if(worldGet(wx,wy,wz)!==B.LEAVES)continue;
      if(!hasWoodOrLeavesNeighbor(wx,wy,wz)||!hasWoodNearby(wx,wy,wz,3)){
        worldSet(wx,wy,wz,B.AIR);
        buildChunkMesh(Math.floor(wx/16),Math.floor(wz/16));
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

  function applyOutlineForTarget(wx,wy,wz,id){
    const fp=getLargeChestFootprint(wx,wy,wz,id);
    if(fp){
      outlineMesh.scale.set(fp.maxX-fp.minX+1,1,fp.maxZ-fp.minZ+1);
      outlineMesh.position.set((fp.minX+fp.maxX+1)/2,wy+0.5,(fp.minZ+fp.maxZ+1)/2);
      return;
    }
    outlineMesh.scale.set(1,1,1);
    outlineMesh.position.set(wx+0.5,wy+0.5,wz+0.5);
  }
   
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
        applyOutlineForTarget(ix,iy,iz,b);outlineMesh.visible=true;
         document.getElementById('crosshair').classList.add('targeting');return;
       }
       if(tmx<tmy&&tmx<tmz){tmx+=tdx;ix+=sx;face=[-sx,0,0];}
       else if(tmy<tmz){tmy+=tdy;iy+=sy;face=[0,-sy,0];}
       else{tmz+=tdz;iz+=sz;face=[0,0,-sz];}
       if(Math.min(tmx,tmy,tmz)>CFG.maxReach)break;
     }
     targetBlock=null;outlineMesh.visible=false;outlineMesh.scale.set(1,1,1);
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
    const chestFp=getLargeChestFootprint(targetBlock.wx,targetBlock.wy,targetBlock.wz,id);
    if(t<=0){
      breaking={active:false,wx:targetBlock.wx,wy:targetBlock.wy,wz:targetBlock.wz,progress:0,total:0,chestFp};
      finishBreaking();
      return;
    }
    breaking={active:true,...targetBlock,progress:0,total:Math.max(0.01,t*getBreakMultiplier(id)),chestFp};
   }
   function stopBreaking(){breaking.active=false;breaking.progress=0;breakMat.opacity=0;breakMesh.scale.set(1,1,1);}
   
   // Particles
   const particles=[];
   const chestShineFx=[];
   function spawnChestPairShine(wx,wy,wz){
    const glow=new THREE.Mesh(new THREE.SphereGeometry(0.18,8,8),new THREE.MeshBasicMaterial({color:0xffde8a,transparent:true,opacity:0.9}));
    glow.position.set(wx+0.5,wy+0.92,wz+0.5);
    glow.userData={life:0.7,baseY:wy+0.92};
    scene.add(glow);
    chestShineFx.push(glow);
   }
   function updateChestShineFx(dt){
    for(let i=chestShineFx.length-1;i>=0;i--){
      const fx=chestShineFx[i];
      fx.userData.life-=dt;
      fx.position.y=fx.userData.baseY+(0.7-fx.userData.life)*0.35;
      const a=Math.max(0,fx.userData.life/0.7);
      fx.material.opacity=a*0.9;
      const s=1+(1-a)*0.9;
      fx.scale.set(s,s,s);
      if(fx.userData.life<=0){scene.remove(fx);fx.geometry.dispose();fx.material.dispose();chestShineFx.splice(i,1);}
    }
   }
   function spawnLargeChestPairFx(a,b,id){
    spawnParticles(a.wx,a.wy,a.wz,id);
    spawnParticles(b.wx,b.wy,b.wz,id);
    spawnChestPairShine(a.wx,a.wy,a.wz);
    spawnChestPairShine(b.wx,b.wy,b.wz);
   }
   function spawnParticles(wx,wy,wz,id){
     if(!particlesEnabled())return;
     const tx=getItemTex(id);
     const pc=document.createElement('canvas');pc.width=pc.height=1;
     const pg=pc.getContext('2d');pg.drawImage(tx.image,4,4,8,8,0,0,1,1);
     const d=pg.getImageData(0,0,1,1).data;
     const col=new THREE.Color(d[0]/255,d[1]/255,d[2]/255);
     const cnt=Math.max(2,Math.round(10*particleCountScale()));
    for(let i=0;i<cnt;i++){
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
  function spawnDropStack(wx,wy,wz,id,count=1,pickupDelay=0){
    const m=new THREE.Mesh(new THREE.BoxGeometry(0.28,0.28,0.28),new THREE.MeshLambertMaterial({map:getItemTex(id)}));
    m.position.set(wx+0.5,wy+0.8,wz+0.5);
    m.userData={id,count,vy:1.5,onGround:false,life:300,bob:Math.random()*Math.PI*2,pickupDelay};
    scene.add(m);drops.push(m);
  }
  function spawnDrops(wx,wy,wz,blockId,pickupDelay=0){
    const table=DROP_TABLE[blockId]??[{id:blockId,count:1,ch:1}];
    table.forEach(entry=>{
      if(Math.random()>entry.ch)return;
      spawnDropStack(wx,wy,wz,entry.id,entry.count,pickupDelay);
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
      d.userData.pickupDelay=Math.max(0,(d.userData.pickupDelay||0)-dt);
      d.visible=d.position.distanceToSquared(player.pos)<(64*64);
      if((d.position.distanceTo(player.pos)<1.8&&d.userData.pickupDelay<=0)||d.userData.life<=0){
         if(d.userData.life>0&&d.userData.pickupDelay<=0)addToInventory(d.userData.id,d.userData.count);
         scene.remove(d);d.geometry.dispose();drops.splice(i,1);
       }
     }
   }


  const primedTnts=[];
  function igniteTnt(wx,wy,wz){
    if(worldGet(wx,wy,wz)!==B.TNT)return;
    worldSet(wx,wy,wz,B.AIR);
    buildChunkMesh(Math.floor(wx/16),Math.floor(wz/16));
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(0.9,0.9,0.9),new THREE.MeshLambertMaterial({map:TEX.tntSide,color:0xffffff}));
    mesh.position.set(wx+0.5,wy+0.5,wz+0.5);
    scene.add(mesh);
    primedTnts.push({mesh,time:1.5,flash:0,vy:0});
  }

  function explodeTnt(wx,wy,wz){
    const r=3.2;
    for(let x=Math.floor(wx-r);x<=Math.ceil(wx+r);x++)for(let y=Math.floor(wy-r);y<=Math.ceil(wy+r);y++)for(let z=Math.floor(wz-r);z<=Math.ceil(wz+r);z++){
      const dx=x+0.5-wx,dy=y+0.5-wy,dz=z+0.5-wz;
      const d=Math.sqrt(dx*dx+dy*dy+dz*dz);
      if(d>r)continue;
      const id=worldGet(x,y,z);
      if(id===B.AIR||id===B.BEDROCK)continue;
      if(id===B.TNT){igniteTnt(x,y,z);continue;}
      const hard=id===B.STONE||id===B.COAL_ORE||id===B.IRON_ORE||id===B.GOLD_ORE||id===B.DIAMOND_ORE||id===B.IRON_BLOCK||id===B.GOLD_BLOCK||id===B.DIAMOND_BLOCK;
      if(!hard||Math.random()<0.24)spawnDrops(x,y,z,id,0.8);
      worldSet(x,y,z,B.AIR);
      spawnParticles(x,y,z,id);
      buildChunkMesh(Math.floor(x/16),Math.floor(z/16));
    }
    for(let i=drops.length-1;i>=0;i--){
      if(drops[i].position.distanceTo(new THREE.Vector3(wx,wy,wz))<r){
        scene.remove(drops[i]);drops[i].geometry.dispose();drops.splice(i,1);
      }
    }
    const pd=player.pos.distanceTo(new THREE.Vector3(wx,wy,wz));
    if(pd<2.3)STATS.health=0;
    else if(pd<6)STATS.health=Math.max(0,STATS.health-(6-pd)*12);
  }

  function updatePrimedTnts(dt){
    for(let i=primedTnts.length-1;i>=0;i--){
      const t=primedTnts[i];
      t.time-=dt;t.flash+=dt*12;
      t.mesh.material.color.setHex((Math.floor(t.flash)%2)?0xffdddd:0xffffff);
      t.vy=Math.max(-24,t.vy-28*dt);
      t.mesh.position.y+=t.vy*dt;
      const bx=Math.floor(t.mesh.position.x),bz=Math.floor(t.mesh.position.z),by=Math.floor(t.mesh.position.y-0.45);
      if(isSolid(worldGet(bx,by,bz))){t.mesh.position.y=by+1.45;t.vy=0;}
      if(t.time<=0){
        const p=t.mesh.position;
        scene.remove(t.mesh);t.mesh.geometry.dispose();t.mesh.material.dispose();
        primedTnts.splice(i,1);
        explodeTnt(p.x,p.y,p.z);
      }
    }
  }
   
   canvas.addEventListener('mousedown',e=>{
     if(!document.pointerLockElement||isPaused||isInvOpen)return;
     if(e.button===0){if(!tryHitBoat())startBreaking();}
     if(e.button===2){if(!tryUseBoat()&&!tryOpenInteractable())placeBlock();}
   });
   canvas.addEventListener('mouseup',e=>{if(e.button===0)stopBreaking();});
   
 
  function finishBreaking(){
    const id=worldGet(breaking.wx,breaking.wy,breaking.wz);
    if(id===B.AIR||id===B.BEDROCK){stopBreaking();return;}
    const targets=[{wx:breaking.wx,wy:breaking.wy,wz:breaking.wz}];
    let chestKey=null;
    if(CHEST_UI[id]){
      chestKey=worldPosKey(breaking.wx,breaking.wy,breaking.wz);
      const pair=getLargeChestFootprint(breaking.wx,breaking.wy,breaking.wz,id);
      if(pair)targets.push({wx:pair.other.wx,wy:pair.other.wy,wz:pair.other.wz});
      const slots=containerData.get(chestStorageKey(chestKey));
      if(slots){
        slots.forEach(st=>{if(!st)return;for(let i=0;i<st.count;i++)spawnDropStack(breaking.wx,breaking.wy,breaking.wz,st.id,1,0.8);});
        containerData.delete(chestStorageKey(chestKey));
        clearPair(chestKey);
      }
    }
    const chunkKeys=new Set();
    for(const t of targets){
      spawnParticles(t.wx,t.wy,t.wz,id);
      spawnDrops(t.wx,t.wy,t.wz,id,0.8);
      worldSet(t.wx,t.wy,t.wz,B.AIR);
      chunkKeys.add(`${Math.floor(t.wx/16)},${Math.floor(t.wz/16)}`);
    }
    for(const ck of chunkKeys){const [cx,cz]=ck.split(',').map(Number);buildChunkMesh(cx,cz);}
    consumeHeldToolDurability(1);
    stopBreaking();
  }

  function tickBreaking(dt){
    if(!breaking.active||!targetBlock){stopBreaking();return;}
    if(targetBlock.wx!==breaking.wx||targetBlock.wy!==breaking.wy||targetBlock.wz!==breaking.wz)startBreaking();
    breaking.progress+=dt;
    const pct=breaking.progress/breaking.total;
    breakMat.opacity=Math.min(0.7,pct*0.7);
    const fp=breaking.chestFp&&worldGet(breaking.wx,breaking.wy,breaking.wz)===worldGet(breaking.chestFp.other.wx,breaking.chestFp.other.wy,breaking.chestFp.other.wz)?breaking.chestFp:null;
    if(fp){
      breakMesh.scale.set(fp.maxX-fp.minX+1,1,fp.maxZ-fp.minZ+1);
      breakMesh.position.set((fp.minX+fp.maxX+1)/2,breaking.wy+0.5,(fp.minZ+fp.maxZ+1)/2);
    }else{
      breakMesh.scale.set(1,1,1);
      breakMesh.position.set(breaking.wx+0.5,breaking.wy+0.5,breaking.wz+0.5);
    }
    if(pct>=1)finishBreaking();
  }
   
   // Block placement (RMB)
   function placeBlock(){
     if(!targetBlock)return;
     const held=INV.hotbar[INV.active];
     if(!held)return;
     if(held.id===IT.BOAT){
      const yawCard=Math.round(player.yaw/(Math.PI/2))*(Math.PI/2);
      const dirX=Math.round(-Math.sin(yawCard));
      const dirZ=Math.round(-Math.cos(yawCard));
      const candidates=[[targetBlock.wx,targetBlock.wy,targetBlock.wz],[targetBlock.wx+targetBlock.face[0],targetBlock.wy+targetBlock.face[1],targetBlock.wz+targetBlock.face[2]]];
      let placed=null;
      for(const [bx,by,bz] of candidates){
        const cells=[[bx,bz],[bx+dirX,bz+dirZ]];
        const ok=cells.every(([cx,cz])=>{
          const fluid=worldGet(cx,by,cz)===B.WATER||worldGet(cx,by-1,cz)===B.WATER;
          const free=!isSolid(worldGet(cx,by,cz))&&!isSolid(worldGet(cx,by+1,cz));
          return fluid&&free;
        });
        if(ok){placed=spawnBoat(bx,by,bz,yawCard);break;}
      }
      if(!placed)return;
      held.count--;if(held.count<=0)INV.hotbar[INV.active]=null;
      updateHotbarUI();drawHand();
      if(!ridingBoat){ridingBoat=placed;placed.userData.riders=1;}
      return;
     }
     if(!isBlockItem(held.id))return;
     const [fx,fy,fz]=targetBlock.face;
     const px=targetBlock.wx+fx,py=targetBlock.wy+fy,pz=targetBlock.wz+fz;
     // Don't place inside player
     const plb=player.pos;
     if(Math.abs(px+0.5-plb.x)<0.4&&Math.abs(py-plb.y)<1.9&&Math.abs(pz+0.5-plb.z)<0.4)return;
     if(worldGet(px,py,pz)!==B.AIR&&!isFluid(worldGet(px,py,pz)))return;
     worldSet(px,py,pz,held.id);
     if(CHEST_UI[held.id]&&!KEYS['ShiftLeft'])tryPairChest(px,py,pz,held.id);
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
    count=Math.max(1,Math.floor(count||1));
    const maxStack=getMaxStackForId(id);
    if(maxStack>1){
      for(let i=0;i<INV.hotbar.length;i++){
        if(INV.hotbar[i]?.id===id&&INV.hotbar[i].count<maxStack){
          const take=Math.min(count,maxStack-INV.hotbar[i].count);
          INV.hotbar[i].count+=take;count-=take;if(count<=0){updateHotbarUI();return;}
        }
      }
      for(let i=0;i<INV.main.length;i++){
        if(INV.main[i]?.id===id&&INV.main[i].count<maxStack){
          const take=Math.min(count,maxStack-INV.main[i].count);
          INV.main[i].count+=take;count-=take;if(count<=0)return;
        }
      }
    }
    while(count>0){
      const take=Math.min(count,maxStack);
      const stack=makeItemStack(id,take);
      const slot=INV.hotbar.findIndex(s=>!s);
      if(slot>=0){INV.hotbar[slot]=stack;count-=take;updateHotbarUI();}
      else{
        const ms=INV.main.findIndex(s=>!s);
        if(ms>=0){INV.main[ms]=stack;count-=take;}
        else break;
      }
    }
  }
   
   // ── CRAFTING RECIPES ───────────────────────────────
   const RECIPES=[
     {w:1,h:1,pat:[B.WOOD],out:{id:B.PLANKS,count:4}},
     {w:1,h:1,pat:[B.STONE],out:{id:B.COBBLESTONE,count:1}},
     {w:1,h:2,pat:[B.PLANKS,B.PLANKS],out:{id:IT.STICK,count:4}},
     {w:1,h:2,pat:[IT.COAL,IT.STICK],out:{id:B.TORCH,count:6}},
     {w:2,h:2,pat:[B.PLANKS,B.PLANKS,B.PLANKS,B.PLANKS],out:{id:B.CRAFTING_TABLE,count:1}},
     {w:3,h:2,pat:[B.PLANKS,0,B.PLANKS,B.PLANKS,B.PLANKS,B.PLANKS],out:{id:IT.BOAT,count:1}},
     {w:3,h:3,pat:[B.PLANKS,B.PLANKS,B.PLANKS,B.PLANKS,0,B.PLANKS,B.PLANKS,B.PLANKS,B.PLANKS],out:{id:B.CHEST,count:1}},
     {w:3,h:3,pat:[B.PLANKS,B.PLANKS,B.PLANKS,0,IT.STICK,0,0,IT.STICK,0],out:{id:IT.WOOD_PICKAXE,count:1}},
     {w:3,h:3,pat:[B.COBBLESTONE,B.COBBLESTONE,B.COBBLESTONE,0,IT.STICK,0,0,IT.STICK,0],out:{id:IT.STONE_PICKAXE,count:1}},
     {w:3,h:3,pat:[IT.IRON_INGOT,IT.IRON_INGOT,IT.IRON_INGOT,0,IT.STICK,0,0,IT.STICK,0],out:{id:IT.IRON_PICKAXE,count:1}},
     {w:3,h:3,pat:[IT.GOLD_INGOT,IT.GOLD_INGOT,IT.GOLD_INGOT,0,IT.STICK,0,0,IT.STICK,0],out:{id:IT.GOLD_PICKAXE,count:1}},
     {w:3,h:3,pat:[IT.DIAMOND,IT.DIAMOND,IT.DIAMOND,0,IT.STICK,0,0,IT.STICK,0],out:{id:IT.DIAMOND_PICKAXE,count:1}},
     {w:2,h:3,pat:[B.PLANKS,B.PLANKS,B.PLANKS,IT.STICK,0,IT.STICK],out:{id:IT.WOOD_AXE,count:1}},
     {w:2,h:3,pat:[B.COBBLESTONE,B.COBBLESTONE,B.COBBLESTONE,IT.STICK,0,IT.STICK],out:{id:IT.STONE_AXE,count:1}},
     {w:2,h:3,pat:[IT.IRON_INGOT,IT.IRON_INGOT,IT.IRON_INGOT,IT.STICK,0,IT.STICK],out:{id:IT.IRON_AXE,count:1}},
     {w:2,h:3,pat:[IT.GOLD_INGOT,IT.GOLD_INGOT,IT.GOLD_INGOT,IT.STICK,0,IT.STICK],out:{id:IT.GOLD_AXE,count:1}},
     {w:2,h:3,pat:[IT.DIAMOND,IT.DIAMOND,IT.DIAMOND,IT.STICK,0,IT.STICK],out:{id:IT.DIAMOND_AXE,count:1}},
     {w:1,h:3,pat:[B.PLANKS,B.PLANKS,IT.STICK],out:{id:IT.WOOD_BLADE,count:1}},
     {w:1,h:3,pat:[B.COBBLESTONE,B.COBBLESTONE,IT.STICK],out:{id:IT.STONE_BLADE,count:1}},
     {w:1,h:3,pat:[IT.IRON_INGOT,IT.IRON_INGOT,IT.STICK],out:{id:IT.IRON_BLADE,count:1}},
     {w:1,h:3,pat:[IT.GOLD_INGOT,IT.GOLD_INGOT,IT.STICK],out:{id:IT.GOLD_BLADE,count:1}},
     {w:1,h:3,pat:[IT.DIAMOND,IT.DIAMOND,IT.STICK],out:{id:IT.DIAMOND_BLADE,count:1}},
     {w:3,h:3,pat:[IT.IRON_INGOT,IT.IRON_INGOT,IT.IRON_INGOT,IT.IRON_INGOT,IT.IRON_INGOT,IT.IRON_INGOT,IT.IRON_INGOT,IT.IRON_INGOT,IT.IRON_INGOT],out:{id:B.IRON_BLOCK,count:1}},
     {w:3,h:3,pat:[IT.GOLD_INGOT,IT.GOLD_INGOT,IT.GOLD_INGOT,IT.GOLD_INGOT,IT.GOLD_INGOT,IT.GOLD_INGOT,IT.GOLD_INGOT,IT.GOLD_INGOT,IT.GOLD_INGOT],out:{id:B.GOLD_BLOCK,count:1}},
     {w:3,h:3,pat:[IT.DIAMOND,IT.DIAMOND,IT.DIAMOND,IT.DIAMOND,IT.DIAMOND,IT.DIAMOND,IT.DIAMOND,IT.DIAMOND,IT.DIAMOND],out:{id:B.DIAMOND_BLOCK,count:1}},
     {w:3,h:3,pat:[B.IRON_BLOCK,B.IRON_BLOCK,B.IRON_BLOCK,B.IRON_BLOCK,B.CHEST,B.IRON_BLOCK,B.IRON_BLOCK,B.IRON_BLOCK,B.IRON_BLOCK],out:{id:B.IRON_CHEST,count:1}},
     {w:3,h:3,pat:[B.GOLD_BLOCK,B.GOLD_BLOCK,B.GOLD_BLOCK,B.GOLD_BLOCK,B.IRON_CHEST,B.GOLD_BLOCK,B.GOLD_BLOCK,B.GOLD_BLOCK,B.GOLD_BLOCK],out:{id:B.GOLD_CHEST,count:1}},
     {w:3,h:3,pat:[B.DIAMOND_BLOCK,B.DIAMOND_BLOCK,B.DIAMOND_BLOCK,B.DIAMOND_BLOCK,B.GOLD_CHEST,B.DIAMOND_BLOCK,B.DIAMOND_BLOCK,B.DIAMOND_BLOCK,B.DIAMOND_BLOCK],out:{id:B.DIAMOND_CHEST,count:1}},
   ];

   function normalizeCraftGrid(grid,size){
     let minX=size,minY=size,maxX=-1,maxY=-1;
     for(let y=0;y<size;y++)for(let x=0;x<size;x++){
       const id=grid[y*size+x]?.id||0;
       if(!id)continue;
       if(x<minX)minX=x;if(y<minY)minY=y;if(x>maxX)maxX=x;if(y>maxY)maxY=y;
     }
     if(maxX<0)return null;
     const w=maxX-minX+1,h=maxY-minY+1;
     const pat=[];
     for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++)pat.push(grid[y*size+x]?.id||0);
     return {w,h,pat};
   }

   function matchRecipe(grid,size){
     const norm=normalizeCraftGrid(grid,size);
     if(!norm)return null;
     for(const rec of RECIPES){
       if(rec.w!==norm.w||rec.h!==norm.h)continue;
       if(rec.pat.every((v,i)=>v===norm.pat[i]))return rec.out;
     }
     return null;
   }
   
   function updateCraftResult(){
     INV.craftResult=matchRecipe(INV.craftGrid,INV.craftGridSize);
     renderCraftOutput();
   }

// ── HOTBAR 3D ICON RENDERER ───────────────────────────────
  function draw3DIcon(canvasEl, id){
     const g=canvasEl.getContext('2d');
     const w=canvasEl.width,h=canvasEl.height;
     g.imageSmoothingEnabled=false;
     g.clearRect(0,0,w,h);
     if(!id)return;
    const bt=id<100?(BLOCK_TEX[id]||BLOCK_TEX[B.STONE]):null;
    const topTex=bt?bt.top:getItemTex(id);
    const sideTex=bt?bt.side:getItemTex(id);
    if(!topTex?.image||!sideTex?.image)return;
     // Draw isometric-ish 3 faces
    const S=Math.floor(w*0.5);
    const ox=Math.floor(w*0.2),oy=Math.floor(h*0.26);
     const sh=Math.floor(S*0.32);
     // Top face
     g.save();g.transform(1,0.3,-1,0.3,ox+S,oy);
    g.drawImage(topTex.image,0,0,S,S);g.restore();
     // Left face (darken)
     g.save();g.transform(1,-0.3,0,0.65,ox,oy+sh*0.55);
    g.drawImage(sideTex.image,0,0,S,S);
     g.fillStyle='rgba(0,0,0,0.28)';g.fillRect(0,0,S,S);
     g.restore();
     // Right face (darker)
     g.save();g.transform(1,0.3,0,0.65,ox+S,oy+sh*0.55);
    g.drawImage(sideTex.image,0,0,S,S);
     g.fillStyle='rgba(0,0,0,0.42)';g.fillRect(0,0,S,S);
     g.restore();
   }
   
  function makeSlotCanvas(id,size=40){
    const c=document.createElement('canvas');c.width=c.height=size;
    draw3DIcon(c,id);return c;
  }
  function appendDurabilityBar(parent,item){
    if(!item||!isDurableItemId(item.id))return;
    ensureStackIntegrity(item);
    const pct=Math.max(0,Math.min(1,item.maxDur?item.dur/item.maxDur:0));
    const wrap=document.createElement('div');wrap.className='durability-wrap';
    const bar=document.createElement('div');bar.className='durability-bar';
    bar.style.width=(pct*100).toFixed(2)+'%';
    if(pct<0.2)bar.style.background='#d44';
    else if(pct<0.45)bar.style.background='#e0b03a';
    wrap.appendChild(bar);parent.appendChild(wrap);
  }
  function consumeHeldToolDurability(amount=1){
    const slot=INV.hotbar[INV.active];
    if(!slot||!isDurableItemId(slot.id))return;
    ensureStackIntegrity(slot);
    slot.dur=Math.max(0,slot.dur-Math.max(1,amount|0));
    if(slot.dur<=0)INV.hotbar[INV.active]=null;
    updateHotbarUI();drawHand();
    if(isInvOpen)buildInventoryUI();
  }
   
   function updateHotbarUI(){
     const slots=document.querySelectorAll('.hb-slot');
     slots.forEach((slot,i)=>{
       slot.classList.toggle('active',i===INV.active);
       // Clear
       while(slot.firstChild)slot.removeChild(slot.firstChild);
       const sn=document.createElement('span');sn.className='slot-num';sn.textContent=i+1;slot.appendChild(sn);
      if(INV.hotbar[i]){
        const item=normalizeStack(INV.hotbar[i]);
        INV.hotbar[i]=item;
        slot.appendChild(makeSlotCanvas(item.id,40));
        appendDurabilityBar(slot,item);
         if(item.count>1){
           const cnt=document.createElement('span');cnt.className='item-count';cnt.textContent=item.count;slot.appendChild(cnt);
         }
         slot.classList.add('has-item');
       }else slot.classList.remove('has-item');
     });
   }
   
  // ── INVENTORY UI ─────────────────────────────────────────
  let dragItem=null;
  let openContainerKey=null;
  let openContainerStorageKey=null;
  let openContainerSlots=null;
  const containerData=new Map();

  const CHEST_UI={
    [B.CHEST]:{name:'Wooden Chest',single:27,cols:9},
    [B.IRON_CHEST]:{name:'Iron Chest',single:54,cols:9},
    [B.GOLD_CHEST]:{name:'Gold Chest',single:81,cols:9},
    [B.DIAMOND_CHEST]:{name:'Diamond Chest',single:108,cols:9},
  };
  const chestPairs=new Map();

  function worldPosKey(wx,wy,wz){ return `${wx},${wy},${wz}`; }
  function parseWorldPosKey(key){const p=(key||'').split(',').map(Number);if(p.length!==3||p.some(v=>!Number.isFinite(v)))return null;return {wx:p[0],wy:p[1],wz:p[2]};}
  function normalizeStack(v){
    if(!v||!Number.isFinite(v.id)||!Number.isFinite(v.count)||v.count<=0)return null;
    return ensureStackIntegrity({...v,id:Math.floor(v.id)});
  }
  function ensureContainer(key,size){
    if(!containerData.has(key))containerData.set(key,Array(size).fill(null));
    const slots=containerData.get(key);
    if(slots.length<size){while(slots.length<size)slots.push(null);}else if(slots.length>size)slots.length=size;
    for(let i=0;i<slots.length;i++)slots[i]=normalizeStack(slots[i]);
    return slots;
  }


  function getPairKey(key){return chestPairs.get(key)||null;}
  function setPair(a,b){chestPairs.set(a,b);chestPairs.set(b,a);}
  function clearPair(key){
    const other=chestPairs.get(key);
    chestPairs.delete(key);
    if(other)chestPairs.delete(other);
  }
  function chestCapacity(blockId,key){
    const meta=CHEST_UI[blockId];
    if(!meta)return 0;
    return meta.single+(getPairKey(key)?27:0);
  }
  function chestStorageKey(key){const other=getPairKey(key);if(!other)return key;return key<other?key:other;}
  function chestUiName(blockId,key){
    const meta=CHEST_UI[blockId];
    if(!meta)return 'Container';
    return getPairKey(key)?`Large ${meta.name}`:meta.name;
  }
  function chestNeighbors(wx,wy,wz,blockId){
    const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
    const out=[];
    for(const [dx,dz] of dirs){
      if(worldGet(wx+dx,wy,wz+dz)!==blockId)continue;
      out.push(worldPosKey(wx+dx,wy,wz+dz));
    }
    return out;
  }
  function tryPairChest(wx,wy,wz,blockId){
    const key=worldPosKey(wx,wy,wz);
    clearPair(key);
    const candidates=chestNeighbors(wx,wy,wz,blockId).filter(k=>!getPairKey(k));
    if(candidates.length===1){
      setPair(key,candidates[0]);
      const other=parseWorldPosKey(candidates[0]);
      if(other)spawnLargeChestPairFx({wx,wy,wz},other,blockId);
    }
  }
  function getLargeChestFootprint(wx,wy,wz,id){
    if(!CHEST_UI[id])return null;
    const key=worldPosKey(wx,wy,wz);
    const other=parseWorldPosKey(getPairKey(key));
    if(!other||other.wy!==wy||worldGet(other.wx,other.wy,other.wz)!==id)return null;
    return {
      minX:Math.min(wx,other.wx),maxX:Math.max(wx,other.wx),
      minZ:Math.min(wz,other.wz),maxZ:Math.max(wz,other.wz),
      other
    };
  }

  function getSourceArray(source){
    if(source==='main')return INV.main;
    if(source==='hotbar')return INV.hotbar;
    if(source==='craft')return INV.craftGrid;
    if(source==='container')return openContainerSlots;
    return null;
  }

  function sourceNameFromArray(arr){
    if(arr===INV.main)return 'main';
    if(arr===INV.hotbar)return 'hotbar';
    if(arr===INV.craftGrid)return 'craft';
    if(arr===openContainerSlots)return 'container';
    return 'main';
  }

  function setDragFromSlot(arr,idx){
    if(!arr||!arr[idx])return false;
    dragItem={item:{...arr[idx]},origin:{source:sourceNameFromArray(arr),idx}};
    arr[idx]=null;
    return true;
  }

  function splitStackToDrag(arr,idx){
    const stack=arr?.[idx];
    if(!stack||stack.count<=1)return false;
    const give=Math.floor(stack.count/2);
    stack.count-=give;
    dragItem={item:{id:stack.id,count:give},origin:{source:sourceNameFromArray(arr),idx}};
    return true;
  }

  function placeSingleFromDrag(arr,idx){
    if(!arr||!dragItem||dragItem.item.count<=0)return false;
    const target=arr[idx];
    if(!target)arr[idx]={id:dragItem.item.id,count:1};
    else if(target.id===dragItem.item.id&&target.count<getMaxStackForId(target.id))target.count+=1;
    else return false;
    dragItem.item.count-=1;
    if(dragItem.item.count<=0){dragItem=null;hideDragGhost();}
    return true;
  }
   
   function makeInvSlot(item,idx,source){
     const s=document.createElement('div');s.className='inv-slot';
     s.dataset.idx=idx;s.dataset.source=source;
   if(item){
      item=normalizeStack(item);
      s.appendChild(makeSlotCanvas(item.id,40));
      appendDurabilityBar(s,item);
       if(item.count>1){const c=document.createElement('span');c.className='item-count';c.textContent=item.count;s.appendChild(c);}
    }
    s.addEventListener('mouseenter',e=>{if(item)showTooltip(e,getItemName(item.id),getItemDescription(item.id,item));});
     s.addEventListener('mouseleave',()=>hideTooltip());
     s.addEventListener('mousedown',e=>{
      const arr=getSourceArray(source);
      if(e.button===0){
        if(!setDragFromSlot(arr,idx))return;
      }else if(e.button===2){
        if(dragItem){
          if(!placeSingleFromDrag(arr,idx))return;
          buildInventoryUI();updateHotbarUI();updateCraftResult();
          if(dragItem)updateDragGhost(dragItem.item,e);
          e.preventDefault();e.stopPropagation();
          return;
        }
        if(!splitStackToDrag(arr,idx))return;
      }else return;
      buildInventoryUI();
      updateDragGhost(dragItem.item,e);
      updateHotbarUI();updateCraftResult();
      e.preventDefault();e.stopPropagation();
    });
     s.addEventListener('mouseup',e=>{
       if(!dragItem)return;
      const arr=getSourceArray(source);
      let leftover=null;
      if(arr[idx]&&arr[idx].id===dragItem.item.id&&arr[idx].count<getMaxStackForId(arr[idx].id)){
        const room=getMaxStackForId(arr[idx].id)-arr[idx].count;
        const take=Math.min(room,dragItem.item.count);
        arr[idx].count+=take;
        dragItem.item.count-=take;
        if(dragItem.item.count>0)leftover={...dragItem.item};
      } else {
        const old=arr[idx];arr[idx]=dragItem.item;
        if(old){
          const oa=getSourceArray(dragItem.origin.source);
          if(oa)oa[dragItem.origin.idx]=old;
        }
      }
      if(leftover){
        const oa=getSourceArray(dragItem.origin.source);
        if(oa){
          if(!oa[dragItem.origin.idx])oa[dragItem.origin.idx]=leftover;
          else if(oa[dragItem.origin.idx].id===leftover.id)oa[dragItem.origin.idx].count=Math.min(getMaxStackForId(leftover.id),oa[dragItem.origin.idx].count+leftover.count);
        }
      }
      dragItem=null;hideDragGhost();buildInventoryUI();updateHotbarUI();updateCraftResult();
      e.stopPropagation();
    });
     return s;
   }

   function setCraftingSize(size,preserve=false){
     const target=size===3?3:2;
     const prev=Array.isArray(INV.craftGrid)?INV.craftGrid:[];
     INV.craftGridSize=target;
     INV.craftGrid=Array(target*target).fill(null);
     if(preserve){
       for(let i=0;i<Math.min(prev.length,INV.craftGrid.length);i++)INV.craftGrid[i]=prev[i];
     }
     INV.craftResult=null;
   }

   function openInventoryMode(){
     INV.uiMode='inventory';
     openContainerKey=null;openContainerStorageKey=null;openContainerSlots=null;
     setCraftingSize(2,false);
   }

   function openCraftingTableMode(){
     INV.uiMode='crafting_table';
     openContainerKey=null;openContainerStorageKey=null;openContainerSlots=null;
     setCraftingSize(3);
   }

   function openChestMode(wx,wy,wz,blockId){
     const cfg=CHEST_UI[blockId];
     if(!cfg)return;
     INV.uiMode='chest';
     openContainerKey=worldPosKey(wx,wy,wz);
     if(!KEYS['ShiftLeft']&&!getPairKey(openContainerKey))tryPairChest(wx,wy,wz,blockId);
     openContainerStorageKey=chestStorageKey(openContainerKey);
     openContainerSlots=ensureContainer(openContainerStorageKey,chestCapacity(blockId,openContainerKey));
     setCraftingSize(2,false);
   }
   
   function renderCraftOutput(){
     const out=document.getElementById('craft-output');
     out.innerHTML='';
     if(INV.craftResult){
       out.appendChild(makeSlotCanvas(INV.craftResult.id,40));
       if(INV.craftResult.count>1){const c=document.createElement('span');c.className='item-count';c.textContent=INV.craftResult.count;out.appendChild(c);}
       out.style.cursor='pointer';
       out.onclick=()=>{
         if(!INV.craftResult)return;
         addToInventory(INV.craftResult.id,INV.craftResult.count);
         INV.craftGrid.forEach((v,i)=>{if(v){v.count--;if(v.count<=0)INV.craftGrid[i]=null;}});
         updateCraftResult();buildInventoryUI();updateHotbarUI();
       };
     } else {out.style.cursor='default';out.onclick=null;}
   }
   
   function buildInventoryUI(){
     const panel=document.getElementById('inv-panel');
     panel.classList.add('compact');

     const craftingGrid=document.getElementById('crafting-grid');
    if(INV.uiMode==='inventory'&&INV.craftGridSize!==2){
      setCraftingSize(2,false);
    }
    const craftSize=INV.craftGridSize===3?3:2;
    if(!Array.isArray(INV.craftGrid)||INV.craftGrid.length!==craftSize*craftSize){
      setCraftingSize(craftSize,false);
    }
    craftingGrid.innerHTML='';
     craftingGrid.style.setProperty('--craft-cols',String(craftSize));
     document.getElementById('crafting-label').textContent=craftSize===3?'Crafting Table':'Crafting';

     const craftRow=document.getElementById('inv-craft-row');
     craftRow.style.display=INV.uiMode==='chest'?'none':'flex';

     for(let i=0;i<INV.craftGrid.length;i++){
       const el=document.createElement('div');
       el.className='craft-slot';
       if(INV.craftGrid[i]){
         el.appendChild(makeSlotCanvas(INV.craftGrid[i].id,40));
         if(INV.craftGrid[i].count>1){const c=document.createElement('span');c.className='item-count';c.textContent=INV.craftGrid[i].count;el.appendChild(c);} 
       }
       el.addEventListener('mousedown',e=>{
         if(e.button===0){if(!setDragFromSlot(INV.craftGrid,i))return;}
         else if(e.button===2){
           if(dragItem){if(!placeSingleFromDrag(INV.craftGrid,i))return;buildInventoryUI();updateCraftResult();if(dragItem)updateDragGhost(dragItem.item,e);e.preventDefault();e.stopPropagation();return;}
           if(!splitStackToDrag(INV.craftGrid,i))return;
         }else return;
         buildInventoryUI();updateDragGhost(dragItem.item,e);updateCraftResult();e.preventDefault();e.stopPropagation();
       });
       el.addEventListener('mouseup',e=>{
         if(!dragItem)return;
         if(!INV.craftGrid[i]){INV.craftGrid[i]=dragItem.item;dragItem=null;hideDragGhost();buildInventoryUI();updateCraftResult();}
         e.stopPropagation();
       });
       craftingGrid.appendChild(el);
     }

     const containerArea=document.getElementById('container-area');
     const containerGrid=document.getElementById('container-grid');
     containerGrid.innerHTML='';
     if(INV.uiMode==='chest'&&openContainerSlots){
       const target=worldGet(...openContainerKey.split(',').map(v=>parseInt(v,10)));
       const cfg=CHEST_UI[target]||{name:'Container',single:openContainerSlots.length,cols:9};
       document.getElementById('container-title').textContent=chestUiName(target,openContainerKey);
       containerGrid.style.setProperty('--container-cols',String(cfg.cols));
       for(let i=0;i<openContainerSlots.length;i++)containerGrid.appendChild(makeInvSlot(openContainerSlots[i],i,'container'));
       containerArea.style.display='flex';
     }else containerArea.style.display='none';

     const mainEl=document.getElementById('inv-main');mainEl.innerHTML='';
     for(let i=0;i<27;i++)mainEl.appendChild(makeInvSlot(INV.main[i],i,'main'));
     const hbEl=document.getElementById('inv-hotbar-row');hbEl.innerHTML='';
     for(let i=0;i<9;i++)hbEl.appendChild(makeInvSlot(INV.hotbar[i],i,'hotbar'));
     renderCraftOutput();
   }

  function openUiScreen(){
    if(isChatOpen)closeChat();
    isInvOpen=true;
    const inv=document.getElementById('inventory-screen');
    buildInventoryUI();
    inv.style.display='flex';
    if(document.pointerLockElement)document.exitPointerLock();
    updateCraftResult();
  }

  function closeUiScreen(){
    isInvOpen=false;
    if(INV.uiMode!=='chest')dropCraftGridToWorld();
    document.getElementById('inventory-screen').style.display='none';
    INV.uiMode='inventory';
    openContainerKey=null;openContainerStorageKey=null;openContainerSlots=null;
    setCraftingSize(2,false);
    if(document.getElementById('game-ui').style.display==='block')canvas.requestPointerLock();
  }

  function toggleInventory(){
    if(isInvOpen){closeUiScreen();return;}
    openInventoryMode();
    openUiScreen();
  }

  function tryOpenInteractable(){
    if(!targetBlock)return false;
    const id=worldGet(targetBlock.wx,targetBlock.wy,targetBlock.wz);
    if(id===B.CRAFTING_TABLE){openCraftingTableMode();openUiScreen();return true;}
    if(CHEST_UI[id]){openChestMode(targetBlock.wx,targetBlock.wy,targetBlock.wz,id);openUiScreen();return true;}
    if(id===B.TNT){igniteTnt(targetBlock.wx,targetBlock.wy,targetBlock.wz);return true;}
    return false;
  }

  document.getElementById('inv-close').addEventListener('click',closeUiScreen);

// Cancel drag on mouseup anywhere
 window.addEventListener('mouseup',(e)=>{
    if(dragItem){
      const invPanel=document.getElementById('inv-panel');
      const inside=invPanel&&invPanel.contains(e.target);
      if(!inside&&isInvOpen){
        dropItemFromUI(dragItem.item);
      }else{
        const arr=getSourceArray(dragItem.origin.source);
        if(arr)arr[dragItem.origin.idx]=dragItem.item;
        else dropItemFromUI(dragItem.item);
      }
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
     g.appendChild(makeSlotCanvas(item.id,40));
     if(item.count>1){const c=document.createElement('span');c.className='dg-count';c.textContent=item.count;g.appendChild(c);}
   }
   function hideDragGhost(){document.getElementById('drag-ghost').style.display='none';}
   function showTooltip(e,name,desc=''){
     const tt=document.getElementById('item-tooltip');
     tt.textContent=desc?`${name}\n${desc}`:name;tt.style.display='block';
     tt.style.left=(e.clientX+12)+'px';tt.style.top=(e.clientY-4)+'px';
   }
  function hideTooltip(){document.getElementById('item-tooltip').style.display='none';}

  function dropItemFromUI(item){
    if(!item||item.id===B.AIR||item.count<=0)return;
    spawnDropStack(Math.floor(player.pos.x),Math.floor(player.pos.y),Math.floor(player.pos.z),item.id,item.count,3);
  }
  function dropCraftGridToWorld(){
    for(let i=0;i<INV.craftGrid.length;i++){
      if(INV.craftGrid[i]){dropItemFromUI(INV.craftGrid[i]);INV.craftGrid[i]=null;}
    }
    INV.craftResult=null;
  }
   
   // ═══════════════════════════════════════════════════════════
   // 13. RIGHT-HAND RENDER
   // ═══════════════════════════════════════════════════════════
   let handPhase=0;
   function drawHand(){
     const hc=document.getElementById('hand-canvas');
     const g=hc.getContext('2d');
     g.clearRect(0,0,160,220);
     const moving=KEYS['KeyW']||KEYS['KeyA']||KEYS['KeyS']||KEYS['KeyD'];
     const sway=moving?Math.sin(handPhase)*6:0;
     const bob=moving?Math.cos(handPhase*2)*4:0;
     // Arm base
     g.fillStyle='#c87941';g.fillRect(78+sway,100+bob,45,120);
     // Arm shading
     g.fillStyle='rgba(0,0,0,0.2)';g.fillRect(78+sway,100+bob,8,120);
     const held=INV.hotbar[INV.active];
     if(held){
       g.save();
       g.translate(85+sway,118+bob);
       g.rotate(-0.55+Math.sin(handPhase*0.8)*0.04);
       const bt=held.id<100?(BLOCK_TEX[held.id]||BLOCK_TEX[B.STONE]):null;
       const top=bt?bt.top:getItemTex(held.id);
       const side=bt?bt.side:getItemTex(held.id);
       if(top?.image&&side?.image){
         g.imageSmoothingEnabled=false;
         const S=46;
         g.save();g.transform(1,0.3,-1,0.3,S,0);g.drawImage(top.image,0,0,S,S);g.restore();
         g.save();g.transform(1,-0.3,0,0.65,0,S*0.17);g.drawImage(side.image,0,0,S,S);g.fillStyle='rgba(0,0,0,0.24)';g.fillRect(0,0,S,S);g.restore();
         g.save();g.transform(1,0.3,0,0.65,S,S*0.17);g.drawImage(side.image,0,0,S,S);g.fillStyle='rgba(0,0,0,0.38)';g.fillRect(0,0,S,S);g.restore();
       }
       g.restore();
     }
   }
   
   // ═══════════════════════════════════════════════════════════
   // 14. PAUSE + SETTINGS
   // ═══════════════════════════════════════════════════════════
  function togglePause(){
     if(isChatOpen)closeChat();
     if(isInvOpen)return;
     isPaused=!isPaused;
     document.getElementById('pause-menu').style.display=isPaused?'flex':'none';
     if(isPaused){if(document.pointerLockElement)document.exitPointerLock();}
     else canvas.requestPointerLock();
   }
  document.getElementById('pause-resume').addEventListener('click',()=>{isPaused=false;document.getElementById('pause-menu').style.display='none';canvas.requestPointerLock();});
  document.getElementById('pause-newWorld').addEventListener('click',()=>startGame(true));
  document.getElementById('pause-settings').addEventListener('click',openSettings);
  document.getElementById('pause-saveMenu').addEventListener('click',()=>{saveGameLocal();location.reload();});
  document.getElementById('settings-back').addEventListener('click',closeSettingsMenu);
  document.getElementById('settings-experimental').addEventListener('click',()=>{
    document.querySelectorAll('.stab').forEach(b=>b.classList.remove('active'));
    buildSettingsTab('experimental');
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
     {key:'guiScale',  label:'GUI Scale',type:'range',min:1,max:4,step:1,unit:''},
     {key:'leavesQuality',label:'Leaves Quality',type:'select',opts:['default','low','medium','high']},
     {key:'shadowsMode', label:'Shadows',type:'select',opts:['default','none','low','medium','high']},
     {key:'particlesMode',label:'Particles',type:'select',opts:['default','low','medium','high']},
     {key:'cloudsMode',label:'Clouds',type:'select',opts:['default','none','low','medium','high']},
     {key:'_optimize', label:'Auto-Optimize for Device',type:'action',action:optimizeSettings},
   ];
  const PLAYER_SETTINGS=[
     {key:'mouseSens', label:'Mouse Sensitivity',type:'range',min:0.0005,max:0.008,step:0.0005,unit:''},
     {key:'touchLookSens',label:'Touch Look Sensitivity',type:'range',min:0.4,max:2.5,step:0.1,unit:'x'},
     {key:'autoJump',label:'Auto Jump',type:'toggle'},
   ];
  const EXPERIMENTAL_SETTINGS=[
    {key:'enableVSync',label:'Enable V-Sync',type:'toggle'},
    {key:'enableNixPlus',label:'Enable Nix+ (Enhanced Graphics)',type:'toggle'},
    {key:'enableCubenixMobile',label:'Enable Cubenix Mobile',type:'toggle'},
    {key:'enableCubenixConnect',label:'Enable Cubenix Connect',type:'toggle'},
    {key:'nixSaturation',label:'Nix+ Saturation',type:'range',min:0.8,max:1.8,step:0.05,unit:'x'},
    {key:'nixContrast',label:'Nix+ Contrast',type:'range',min:0.8,max:1.6,step:0.05,unit:'x'},
    {key:'nixGlow',label:'Nix+ Glow',type:'range',min:0,max:1,step:0.05,unit:''},
  ];

   const SETTINGS_KEYS=['renderDist','simDist','fov','brightness','fogDensity','guiScale','leavesQuality','shadowsMode','particlesMode','cloudsMode','mouseSens','touchLookSens','autoJump','enableVSync','enableNixPlus','enableCubenixMobile','enableCubenixConnect','nixSaturation','nixContrast','nixGlow'];
   let settingsContext='pause'; // pause | menu

   function saveSettingsLocal(){
     try{
       const data={};
       SETTINGS_KEYS.forEach(k=>{data[k]=CFG[k];});
       localStorage.setItem(SETTINGS_KEY,JSON.stringify(data));
     }catch{}
   }
  function loadSettingsLocal(){
     try{
       const raw=localStorage.getItem(SETTINGS_KEY);
       if(!raw)return;
       const data=JSON.parse(raw);
      SETTINGS_KEYS.forEach(k=>{if(data[k]!==undefined)CFG[k]=data[k];});
      if(typeof data.shadows==='boolean'&&data.shadowsMode===undefined)CFG.shadowsMode=data.shadows?'default':'none';
      if(typeof data.particles==='boolean'&&data.particlesMode===undefined)CFG.particlesMode=data.particles?'default':'none';
      if(typeof data.clouds==='boolean'&&data.cloudsMode===undefined)CFG.cloudsMode=data.clouds?'default':'none';
      CFG.autosave=true;
    }catch{}
  }

   function serializeInventory(arr){
     return arr.map(s=>s?{id:s.id,count:s.count,dur:s.dur,maxDur:s.maxDur}:null);
   }
   function deserializeInventory(src,len){
     const out=Array(len).fill(null);
     for(let i=0;i<len;i++){
       const it=src?.[i];
       if(it&&Number.isFinite(it.id)&&Number.isFinite(it.count)&&it.count>0)out[i]=normalizeStack({id:it.id,count:it.count,dur:it.dur,maxDur:it.maxDur});
     }
     return out;
   }
   function saveGameLocal(){
     if(!CFG.autosave)return;
     try{
       const data={
        version:'0.0.54a',
        seed:CURRENT_SEED,
         player:{x:player.pos.x,y:player.pos.y,z:player.pos.z,yaw:player.yaw,pitch:player.pitch},
         stats:{health:STATS.health,shield:STATS.shield,hunger:STATS.hunger,energy:STATS.energy,armor:STATS.armor},
         inv:{hotbar:serializeInventory(INV.hotbar),main:serializeInventory(INV.main),active:INV.active,craftGrid:serializeInventory(INV.craftGrid)},
         containers:[...(typeof containerData!=='undefined'?containerData.entries():[])].map(([k,v])=>[k,serializeInventory(v)]),
         ts:Date.now(),
       };
       localStorage.setItem(AUTOSAVE_KEY,JSON.stringify(data));
      localStorage.setItem(SEED_KEY,String(CURRENT_SEED));
       saveSettingsLocal();
     }catch{}
   }
  function loadAutosaveLocal(){
     try{
       const raw=localStorage.getItem(AUTOSAVE_KEY);
       if(!raw)return null;
       const data=JSON.parse(raw);
       if(!data||!data.player)return null;
       return data;
    }catch{return null;}
  }

  function clearWorldState(){
    for(const k of chunkMeshes.keys()){
      const m=chunkMeshes.get(k);
      scene.remove(m);
      m.traverse(o=>{if(o.geometry)o.geometry.dispose();});
    }
    chunkMeshes.clear();
    chunkData.clear();
    loadedChunks.clear();
    chunkQueue.length=0;
    for(let i=drops.length-1;i>=0;i--){scene.remove(drops[i]);drops[i].geometry.dispose();}
    drops.length=0;
    for(let i=fallingBlockEntities.length-1;i>=0;i--){scene.remove(fallingBlockEntities[i]);fallingBlockEntities[i].geometry.dispose();}
    fallingBlockEntities.length=0;
    fallingBlockKeys.clear();
    if(typeof containerData!=='undefined')containerData.clear();
    if(typeof chestPairs!=='undefined')chestPairs.clear();
    primedTnts.forEach(t=>{scene.remove(t.mesh);t.mesh.geometry.dispose();t.mesh.material.dispose();});
    primedTnts.length=0;
    for(const l of torchLights.values())scene.remove(l);
    torchLights.clear();
    for(let i=chestShineFx.length-1;i>=0;i--){scene.remove(chestShineFx[i]);chestShineFx[i].geometry.dispose();chestShineFx[i].material.dispose();}
    chestShineFx.length=0;
    for(const b of boats){scene.remove(b);b.geometry.dispose();b.material.dispose();}
    boats.length=0;
    ridingBoat=null;
  }

  function applyGuiScale(){
    const scale=Math.max(1,Math.min(4,Math.round(CFG.guiScale)))/3;
    document.documentElement.style.setProperty('--gui-scale',String(scale));
  }
   
   function buildSettingsTab(tab){
     const body=document.getElementById('settings-body');body.innerHTML='';
     const list=tab==='video'?VIDEO_SETTINGS:(tab==='player'?PLAYER_SETTINGS:EXPERIMENTAL_SETTINGS);
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
   const nixPlus=!!CFG.enableNixPlus;
   const shScale=qualityFactor(CFG.shadowsMode);
   renderer.shadowMap.enabled=nixPlus?false:shScale>0;
   renderer.setPixelRatio(nixPlus?1:Math.min(window.devicePixelRatio,2));
   const canvasEl=document.getElementById('game-canvas');
   if(nixPlus){
    const sat=Math.max(0.8,Math.min(1.8,CFG.nixSaturation));
    const con=Math.max(0.8,Math.min(1.6,CFG.nixContrast));
    const glow=Math.max(0,Math.min(1,CFG.nixGlow));
    canvasEl.style.filter=`saturate(${sat}) contrast(${con}) brightness(${1+glow*0.12})`;
   }else canvasEl.style.filter='none';
     const fn=CFG.renderDist*16*CFG.fogDensity;
    scene.fog.near=fn*0.5;scene.fog.far=fn;
    const cScale=cloudCountScale();
    clouds.forEach((c,i)=>{c.visible=cloudsEnabled()&&(i<Math.floor(clouds.length*Math.max(0.15,cScale)));});
    sun.castShadow=!nixPlus&&shScale>0;
    sun.shadow.mapSize.set(shScale>=0.95?2048:shScale>=0.7?1536:1024,shScale>=0.95?2048:shScale>=0.7?1536:1024);
    applyTouchControllerVisibility();
    if(!CFG.enableCubenixConnect){
      ['KeyW','KeyA','KeyS','KeyD','Space','ShiftLeft'].forEach(k=>setVirtualKey(k,'pad',false));
      CONTROLLER.prevButtons.length=0;
      stopBreaking();
    }
    applyGuiScale();
    saveSettingsLocal();
  }
   
  function optimizeSettings(){
     const hi=window.devicePixelRatio>=2&&(navigator.hardwareConcurrency||4)>=8;
     CFG.renderDist=hi?10:6;CFG.simDist=hi?8:4;CFG.shadowsMode=hi?'default':'low';CFG.particlesMode='default';CFG.cloudsMode=hi?'default':'medium';CFG.fogDensity=hi?0.8:0.55;
     renderer.setPixelRatio(hi?Math.min(window.devicePixelRatio,2):1);
     applySettings();
   }

   loadSettingsLocal();
   
   function openSettings(){
     settingsContext='pause';
     document.getElementById('pause-menu').style.display='none';
     document.getElementById('settings-menu').style.display='flex';
     document.querySelector('.stab[data-tab="video"]').classList.add('active');
     document.querySelector('.stab[data-tab="player"]').classList.remove('active');
     buildSettingsTab('video');
   }
   function openSettingsFromMenu(){
     settingsContext='menu';
     document.getElementById('settings-menu').style.display='flex';
     document.querySelectorAll('.stab').forEach(b=>b.classList.remove('active'));
     document.querySelector('.stab[data-tab="video"]').classList.add('active');
     buildSettingsTab('video');
   }

   function closeSettingsMenu(){
     document.getElementById('settings-menu').style.display='none';
     if(settingsContext==='pause')document.getElementById('pause-menu').style.display='flex';
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
    const hpPct=Math.round(Math.max(0,Math.min(100,STATS.health/STATS.maxHealth*100)));
    const shieldPct=Math.round(Math.max(0,Math.min(100,STATS.shield/STATS.maxShield*100)));
    const hungerPct=Math.round(Math.max(0,Math.min(100,STATS.hunger/STATS.maxHunger*100)));
    const energyPct=Math.round(Math.max(0,Math.min(100,STATS.energy/STATS.maxEnergy*100)));
    const armorPct=Math.round(Math.max(0,Math.min(100,STATS.armor/STATS.maxArmor*100)));
    const airPct=Math.round(Math.max(0,Math.min(100,STATS.air/STATS.maxAir*100)));

    document.getElementById('health-bar').style.width=hpPct+'%';
    document.getElementById('shield-bar').style.width=shieldPct+'%';
    document.getElementById('hunger-bar').style.width=hungerPct+'%';
    document.getElementById('energy-bar').style.width=energyPct+'%';
    document.getElementById('armor-bar').style.width=armorPct+'%';
    document.getElementById('air-bar').style.width=airPct+'%';

    document.getElementById('health-pct').textContent=`${hpPct}%`;
    document.getElementById('shield-pct').textContent=`${shieldPct}%`;
    document.getElementById('hunger-pct').textContent=`${hungerPct}%`;
    document.getElementById('energy-pct').textContent=`${energyPct}%`;
    document.getElementById('armor-pct').textContent=`${armorPct}%`;
    document.getElementById('air-pct').textContent=`${airPct}%`;

    document.getElementById('armor-bar-wrap').style.display=STATS.armor>0?'flex':'none';
    const ew=document.getElementById('energy-bar-wrap');
    const aw=document.getElementById('air-bar-wrap');
    aw.style.display=STATS.air<STATS.maxAir?'flex':'none';
    if(STATS.energy>=STATS.maxEnergy){ew.classList.add('hidden');ew.classList.remove('flash');}
    else{ew.classList.remove('hidden');ew.classList.toggle('flash',STATS.energy<15);}
    const tsc=document.getElementById('touch-sprint-cooldown');
    if(tsc)tsc.style.height=(100-energyPct)+'%';
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
      `FPS: ${fps} | Chunks: ${loadedChunks.size} | ${tod} | Seed: ${CURRENT_SEED}<br>`+`Border: ${(WORLD_BORDER_BLOCKS-Math.max(Math.abs(p.x),Math.abs(p.z))).toFixed(0)} blocks`;
   }
   
   // ═══════════════════════════════════════════════════════════
   // 20. MAIN LOOP
   // ═══════════════════════════════════════════════════════════
   let lastNow=performance.now(),chunkT=0,fallT=0,autosaveT=0,waterFlowT=0,lavaFlowT=0;
   function loop(){
     requestAnimationFrame(loop);
    const now=performance.now();const dt=Math.min((now-lastNow)*0.001,0.05);lastNow=now;
    if(!isPaused&&!isInvOpen){
      updateControllerInput();
      handPhase+=dt*9;
       movePlayer(dt);raycastWorld();tickBreaking(dt);
       updateParticles(dt);updateChestShineFx(dt);updateDrops(dt);updatePrimedTnts(dt);
       updateDayNight(dt);updateAnimTex(dt);
       clouds.forEach(c=>{c.position.x+=c.userData.spd*dt;if(c.position.x>200)c.position.x=-200;});
       chunkT+=dt;if(chunkT>0.35){chunkT=0;updateChunks();}
      fallT+=dt;if(fallT>0.25){fallT=0;updateFallingBlocks();}
      waterFlowT+=dt;if(waterFlowT>0.12){waterFlowT=0;flowFluidOnce(B.WATER,10);}
      lavaFlowT+=dt;if(lavaFlowT>0.62){lavaFlowT=0;flowFluidOnce(B.LAVA,7);}
      updateFallingEntities(dt);
       updateLeavesDecay(dt);
       processChunkQueue(2);
     }
     drawHand();
     autosaveT+=dt;
     if(autosaveT>=15){autosaveT=0;saveGameLocal();}
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
  async function startGame(isRegenerate=false){
     CFG.autosave=true;
     isPaused=false;
     if(isInvOpen)closeUiScreen();
     document.getElementById('pause-menu').style.display='none';
     clearWorldState();
     setWorldSeed(randomSeed());
     document.getElementById('main-menu').style.display='none';
     const loadingEl=document.getElementById('loading-screen');
     loadingEl.style.transition='none';
     loadingEl.style.opacity='1';
     loadingEl.style.display='flex';
     document.getElementById('loading-sub').textContent=isRegenerate?'Generating New World...':'Generating World...';
     document.getElementById('game-canvas').style.display='block';
     document.getElementById('game-ui').style.display='block';
   
     setLoad(5,isRegenerate?'GENERATING NEW WORLD':'PREPARING WORLD');

     const cx0=0;
     const cz0=0;

     setLoad(12,'GENERATING TERRAIN');
     const R=3;
     const coords=[];
     for(let dx=-R;dx<=R;dx++)for(let dz=-R;dz<=R;dz++)coords.push({cx:cx0+dx,cz:cz0+dz});
     const genTotal=coords.length;
     let done=0,lastYield=performance.now();
     for(const {cx,cz} of coords){
       generateChunk(cx,cz);done++;
       if(performance.now()-lastYield>10){
         setLoad(12+Math.round(done/genTotal*52),'GENERATING TERRAIN');
         await delay(0);lastYield=performance.now();
       }
     }
     setLoad(64,'GENERATING TERRAIN');

    // Always start a new world in singleplayer for now
    STATS.health=STATS.maxHealth;STATS.shield=STATS.maxShield;STATS.hunger=STATS.maxHunger;STATS.energy=STATS.maxEnergy;STATS.air=STATS.maxAir;
    STATS.armor=0;
    INV.hotbar=Array(9).fill(null);
    INV.main=Array(27).fill(null);
    setCraftingSize(2,false);
    INV.uiMode='inventory';
    INV.active=0;
    const spawn=findSafeSpawn(100,cx0*16,cz0*16);
    if(spawn){
      player.pos.set(spawn.wx+0.5,spawn.y+1,spawn.wz+0.5);
    }else{
      const y=Math.max(CFG.seaLevel+2,getHeight(cx0*16,cz0*16)+1);
      player.pos.set(cx0*16+0.5,y,cz0*16+0.5);
    }
    player.vel.set(0,0,0);
    player.onGround=false;
    player.height=player.standHeight;
    player.eyeOffset=player.standEyeOffset;
    camera.position.set(player.pos.x,player.pos.y+player.eyeOffset,player.pos.z);

    // alpha test stash: force a diamond chest in front of spawn with 99x known IDs
    const frontX=Math.round(-Math.sin(player.yaw))||1;
    const frontZ=Math.round(-Math.cos(player.yaw));
    const chestX=Math.floor(player.pos.x)+frontX;
    const chestZ=Math.floor(player.pos.z)+frontZ;
    const chestY=Math.max(1,Math.floor(player.pos.y));
    worldSet(chestX,chestY,chestZ,B.DIAMOND_CHEST);
    const alphaKey=worldPosKey(chestX,chestY,chestZ);
    const alphaSlots=ensureContainer(alphaKey,chestCapacity(B.DIAMOND_CHEST,alphaKey));
    const allIds=getAllKnownIds();
    for(let i=0;i<alphaSlots.length&&i<allIds.length;i++)alphaSlots[i]=makeItemStack(allIds[i],getMaxStackForId(allIds[i]));

     setLoad(70,'BUILDING MESHES');
     done=0;lastYield=performance.now();
     for(const {cx,cz} of coords){
       buildChunkMesh(cx,cz);loadedChunks.add(`${cx},${cz}`);done++;
       if(performance.now()-lastYield>10){
         setLoad(70+Math.round(done/genTotal*25),'BUILDING MESHES');
         await delay(0);lastYield=performance.now();
       }
     }
     setLoad(96,'FINALIZING');
     await delay(30);
     setLoad(100,'DONE');
     await delay(120);
   
     const ls=document.getElementById('loading-screen');
     ls.style.opacity='0';ls.style.transition='opacity 0.8s';
     setTimeout(()=>ls.style.display='none',900);

     applySettings();
     updateHotbarUI();drawHand();
     if(!window.__cubenixLoopStarted){window.__cubenixLoopStarted=true;loop();}
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
  window.addEventListener('beforeunload',()=>saveGameLocal());
   
   // ═══════════════════════════════════════════════════════════
   // 23. RESIZE
   // ═══════════════════════════════════════════════════════════
   window.addEventListener('resize',()=>{
     camera.aspect=window.innerWidth/window.innerHeight;
     camera.updateProjectionMatrix();
     renderer.setSize(window.innerWidth,window.innerHeight);
   });
