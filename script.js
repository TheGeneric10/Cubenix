/* ============================================================
   CUBENIX — script.js — v0.0.89_patch6
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
     jumpVel:8.5, gravity:22.0,
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
    enableWeather:true,
    showSunMoon:true,
    enableNixPlus:false,
    enableCubenixMobile:false,
    enableCubenixConnect:false,
    nixSaturation:1.2,
    nixContrast:1.08,
    nixGlow:0.35,
   };

   const AUTOSAVE_KEY='cubenix.autosave.v1';
   const WORLDS_KEY='cubenix.worlds.v1';
   const WORLD_STATE_PREFIX='cubenix.worldstate.';
   const LOCAL_JSON_SAVE_KEY='cubenix.localsave.json';
   const SETTINGS_KEY='cubenix.settings.v1';
   const SEED_KEY='cubenix.seed.v1';
const WORLD_BORDER_BLOCKS=13000000;
   
   // Block IDs
   const B={
     AIR:0,GRASS:1,DIRT:2,STONE:3,BEDROCK:4,
     SAND:5,WOOD:6,LEAVES:7,WATER:8,LAVA:9,
     COAL_ORE:10,IRON_ORE:11,GOLD_ORE:12,DIAMOND_ORE:13,
     GRAVEL:14,CRAFTING_TABLE:15,PLANKS:16,CHEST:17,IRON_CHEST:18,GOLD_CHEST:19,DIAMOND_CHEST:20,TNT:21,IRON_BLOCK:22,GOLD_BLOCK:23,DIAMOND_BLOCK:24,
    COBBLESTONE:25,RED_SAND:26,TORCH:27,FIRE:28,DEV_CHEST:29,GRASS_PATH:30,FARMLAND_DRY:31,FARMLAND_WET:32,BED:33,
    OAK_SLAB:93,STONE_SLAB:94,COBBLE_SLAB:95,
  };
   const BLOCK_NAMES=[
     'Air','Grass','Dirt','Stone','Bedrock','Sand',
     'Oak Log','Leaves','Water','Lava',
     'Coal Ore','Iron Ore','Gold Ore','Diamond Ore',
     'Gravel','Crafting Table','Oak Planks','Chest','Iron Chest','Gold Chest','Diamond Chest','TNT','Iron Block','Gold Block','Diamond Block',
    'Cobblestone','Red Sand','Torch','Fire','Developer Chest','Grass Path','Farmland','Wet Farmland','Bed',
   ];

   const WOOL_BASE_ID=40;
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
    BOAT:120,FLINT:121,FLINT_STEEL:122,BOW:123,ARROW:124,WOOD_SHOVEL:125,STONE_SHOVEL:126,IRON_SHOVEL:127,GOLD_SHOVEL:128,DIAMOND_SHOVEL:129,WOOD_HOE:130,STONE_HOE:131,IRON_HOE:132,GOLD_HOE:133,DIAMOND_HOE:134,BUCKET:135,WATER_BUCKET:136,LAVA_BUCKET:137,
    PORKCHOP_RAW:138,PORKCHOP_COOKED:139,LAMB_RAW:140,LAMB_COOKED:141,BEEF_RAW:142,BEEF_COOKED:143,ROTTEN_FLESH:144,CHICKEN_RAW:145,CHICKEN_COOKED:146,SHEARS:147,BED:148,
     // block items reuse block IDs for placement
   };
   const ITEM_NAMES={
     [IT.COAL]:'Coal',[IT.IRON_INGOT]:'Iron Ingot',
     [IT.GOLD_INGOT]:'Gold Ingot',[IT.DIAMOND]:'Diamond',
     [IT.STICK]:'Stick',[IT.WOOD_PICKAXE]:'Wooden Pickaxe',
     [IT.STONE_PICKAXE]:'Stone Pickaxe',[IT.IRON_PICKAXE]:'Iron Pickaxe',[IT.GOLD_PICKAXE]:'Golden Pickaxe',[IT.DIAMOND_PICKAXE]:'Diamond Pickaxe',
     [IT.WOOD_AXE]:'Wooden Axe',[IT.STONE_AXE]:'Stone Axe',[IT.IRON_AXE]:'Iron Axe',[IT.GOLD_AXE]:'Golden Axe',[IT.DIAMOND_AXE]:'Diamond Axe',
     [IT.WOOD_BLADE]:'Wooden Blade',[IT.STONE_BLADE]:'Stone Blade',[IT.IRON_BLADE]:'Iron Blade',[IT.GOLD_BLADE]:'Golden Blade',[IT.DIAMOND_BLADE]:'Diamond Blade',
     [IT.BOAT]:'Boat',[IT.FLINT]:'Flint',[IT.FLINT_STEEL]:'Flint and Steel',
     [IT.BOW]:'Bow',[IT.ARROW]:'Arrow',
     [IT.WOOD_SHOVEL]:'Wooden Shovel',[IT.STONE_SHOVEL]:'Stone Shovel',[IT.IRON_SHOVEL]:'Iron Shovel',[IT.GOLD_SHOVEL]:'Golden Shovel',[IT.DIAMOND_SHOVEL]:'Diamond Shovel',
     [IT.WOOD_HOE]:'Wooden Hoe',[IT.STONE_HOE]:'Stone Hoe',[IT.IRON_HOE]:'Iron Hoe',[IT.GOLD_HOE]:'Golden Hoe',[IT.DIAMOND_HOE]:'Diamond Hoe',
     [IT.BUCKET]:'Bucket',[IT.WATER_BUCKET]:'Water Bucket',[IT.LAVA_BUCKET]:'Lava Bucket',
     [IT.SHEARS]:'Shears',[IT.BED]:'Bed',
     [IT.PORKCHOP_RAW]:'Porkchop (Uncooked)',[IT.PORKCHOP_COOKED]:'Porkchop (Cooked)',
     [IT.LAMB_RAW]:'Lamb (Uncooked)',[IT.LAMB_COOKED]:'Lamb (Cooked)',
     [IT.BEEF_RAW]:'Beef (Uncooked)',[IT.BEEF_COOKED]:'Beef (Cooked)',
     [IT.ROTTEN_FLESH]:'Rotten Flesh',[IT.CHICKEN_RAW]:'Chicken (Uncooked)',[IT.CHICKEN_COOKED]:'Chicken (Cooked)',
   };
  const KEYBIND_DEFAULTS={
    forward:'KeyW',left:'KeyA',back:'KeyS',right:'KeyD',
    jump:'Space',sneak:'ShiftLeft',inventory:'KeyE',chat:'KeyT',pause:'KeyP'
  };
  const KEYBIND_DEFS=[
    {action:'forward',label:'Move Forward',canonical:'KeyW'},
    {action:'left',label:'Move Left',canonical:'KeyA'},
    {action:'back',label:'Move Back',canonical:'KeyS'},
    {action:'right',label:'Move Right',canonical:'KeyD'},
    {action:'jump',label:'Jump',canonical:'Space'},
    {action:'sneak',label:'Sneak',canonical:'ShiftLeft'},
    {action:'inventory',label:'Inventory',canonical:'KeyE'},
    {action:'chat',label:'Chat',canonical:'KeyT'},
    {action:'pause',label:'Pause',canonical:'KeyP'},
  ];
  const KEYBINDS={...KEYBIND_DEFAULTS};
   const FOOD_STATS={
    [IT.PORKCHOP_RAW]:{nutrition:5,sat:2.6},
    [IT.PORKCHOP_COOKED]:{nutrition:10,sat:6.2},
    [IT.LAMB_RAW]:{nutrition:4,sat:2.2},
    [IT.LAMB_COOKED]:{nutrition:9,sat:5.8},
    [IT.BEEF_RAW]:{nutrition:4,sat:2.4},
    [IT.BEEF_COOKED]:{nutrition:10,sat:6.5},
    [IT.CHICKEN_RAW]:{nutrition:3,sat:1.8},
    [IT.CHICKEN_COOKED]:{nutrition:7,sat:4.6},
    [IT.ROTTEN_FLESH]:{nutrition:3,sat:0.6,bad:true},
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
    [IT.STONE_PICKAXE]:{atk:3,speed:1.1,eff:42,type:'pickaxe'},
    [IT.IRON_PICKAXE]:{atk:4,speed:1.05,eff:58,type:'pickaxe'},
    [IT.GOLD_PICKAXE]:{atk:3,speed:1.25,eff:76,type:'pickaxe'},
    [IT.DIAMOND_PICKAXE]:{atk:5,speed:1.0,eff:88,type:'pickaxe'},
    [IT.WOOD_AXE]:{atk:3,speed:1.0,eff:18,type:'axe'},
    [IT.STONE_AXE]:{atk:4,speed:0.95,eff:38,type:'axe'},
    [IT.IRON_AXE]:{atk:5,speed:0.9,eff:54,type:'axe'},
    [IT.GOLD_AXE]:{atk:4,speed:1.1,eff:68,type:'axe'},
    [IT.DIAMOND_AXE]:{atk:6,speed:0.85,eff:82,type:'axe'},
    [IT.WOOD_BLADE]:{atk:4,speed:1.4,type:'blade'},
    [IT.STONE_BLADE]:{atk:5,speed:1.35,type:'blade'},
    [IT.IRON_BLADE]:{atk:6,speed:1.28,type:'blade'},
    [IT.GOLD_BLADE]:{atk:5,speed:1.55,type:'blade'},
    [IT.DIAMOND_BLADE]:{atk:8,speed:1.18,type:'blade'},
    [IT.WOOD_SHOVEL]:{atk:2,speed:1.1,eff:28,type:'shovel'},
    [IT.STONE_SHOVEL]:{atk:3,speed:1.08,eff:45,type:'shovel'},
    [IT.IRON_SHOVEL]:{atk:4,speed:1.05,eff:62,type:'shovel'},
    [IT.GOLD_SHOVEL]:{atk:3,speed:1.2,eff:80,type:'shovel'},
    [IT.DIAMOND_SHOVEL]:{atk:5,speed:1.0,eff:90,type:'shovel'},
    [IT.WOOD_HOE]:{atk:1,speed:1.2,eff:24,type:'hoe'},
    [IT.STONE_HOE]:{atk:2,speed:1.15,eff:42,type:'hoe'},
    [IT.IRON_HOE]:{atk:3,speed:1.1,eff:58,type:'hoe'},
    [IT.GOLD_HOE]:{atk:2,speed:1.25,eff:76,type:'hoe'},
    [IT.DIAMOND_HOE]:{atk:4,speed:1.05,eff:88,type:'hoe'},
    [IT.BOW]:{atk:5,speed:0.9,type:'bow'},
   };
  function isHardMaterial(id){return id===B.STONE||id===B.COBBLESTONE||id===B.COAL_ORE||id===B.IRON_ORE||id===B.GOLD_ORE||id===B.DIAMOND_ORE||id===B.IRON_BLOCK||id===B.GOLD_BLOCK||id===B.DIAMOND_BLOCK;}
   function isDirtMaterial(id){return id===B.DIRT||id===B.GRASS||id===B.SAND||id===B.GRAVEL||id===B.RED_SAND||id===B.GRASS_PATH||id===B.FARMLAND_DRY||id===B.FARMLAND_WET;}
   function isWoodMaterial(id){return id===B.WOOD||id===B.PLANKS||id===B.CRAFTING_TABLE||id===B.CHEST||id===B.IRON_CHEST||id===B.GOLD_CHEST||id===B.DIAMOND_CHEST||id===B.DEV_CHEST||id===B.BED;}
   function isBurnableBlock(id){
    return id===B.WOOD||id===B.PLANKS||id===B.LEAVES||id===B.TNT||(id>=WOOL_BASE_ID&&id<WOOL_BASE_ID+WOOL_COLORS.length)||id===B.CHEST||id===B.DEV_CHEST||id===B.BED;
   }
   function getActiveToolStats(){const held=INV.hotbar[INV.active];return held?TOOL_STATS[held.id]||null:null;}
  function getBreakMultiplier(blockId){
    const t=getActiveToolStats();
    if(!t)return 1;
    const eff=Math.max(0,Math.min(99,Number(t.eff)||0));
    const match=(t.type==='pickaxe'&&isHardMaterial(blockId))||(t.type==='axe'&&isWoodMaterial(blockId))||(t.type==='shovel'&&isDirtMaterial(blockId))||(t.type==='hoe'&&(blockId>=WOOL_BASE_ID&&blockId<WOOL_BASE_ID+WOOL_COLORS.length));
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
   [IT.FLINT_STEEL]:64,[IT.BOW]:384,
   [IT.WOOD_SHOVEL]:59,[IT.STONE_SHOVEL]:131,[IT.IRON_SHOVEL]:250,[IT.GOLD_SHOVEL]:32,[IT.DIAMOND_SHOVEL]:1561,
   [IT.WOOD_HOE]:59,[IT.STONE_HOE]:131,[IT.IRON_HOE]:250,[IT.GOLD_HOE]:32,[IT.DIAMOND_HOE]:1561,
   [IT.SHEARS]:238,
   };
   function isDurableItemId(id){return !!(TOOL_STATS[id]||DURABILITY_MAX[id]);}
   function getMaxStackForId(id){
    if(id===IT.BUCKET)return 9;
    if(id===IT.WATER_BUCKET||id===IT.LAVA_BUCKET||id===IT.BED)return 1;
    return isDurableItemId(id)||id===IT.BOAT?1:99;
   }
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
  function formatDateStamp(ts){
    const d=new Date(Number(ts)||0);
    if(Number.isNaN(d.getTime()))return 'Unknown';
    const mm=String(d.getMonth()+1).padStart(2,'0');
    const dd=String(d.getDate()).padStart(2,'0');
    const yyyy=String(d.getFullYear()).padStart(4,'0');
    return `${mm}/${dd}/${yyyy}`;
  }
  function captureWorldThumbnail(){
    try{
      const src=document.getElementById('game-canvas');
      if(!src||src.style.display==='none'||!src.width||!src.height)return '';
      const c=document.createElement('canvas');
      c.width=64;c.height=64;
      const g=c.getContext('2d',{alpha:false});
      g.filter='none';
      g.drawImage(src,0,0,c.width,c.height);
      return c.toDataURL('image/png');
    }catch{
      return '';
    }
  }
  function getBlockHeight(id){
    if(id===B.OAK_SLAB||id===B.STONE_SLAB||id===B.COBBLE_SLAB)return 0.5;
    if(id===B.GRASS_PATH||id===B.FARMLAND_DRY||id===B.FARMLAND_WET)return 0.9;
    if(id===B.BED)return 0.56;
    return 1;
  }
  function isPartialHeightBlock(id){return getBlockHeight(id)<1;}
  function formatKeyCode(code){
    if(!code)return 'Unbound';
    return code.replace(/^Key/,'').replace(/^Digit/,'').replace('Arrow','').replace('Left',' L').replace('Right',' R');
  }
  function normalizeKeybinds(raw){
    const next={...KEYBIND_DEFAULTS};
    for(const def of KEYBIND_DEFS){
      if(raw?.[def.action])next[def.action]=String(raw[def.action]);
    }
    return next;
  }
  function isDuplicateKeybind(action){
    const code=KEYBINDS[action];
    if(!code)return false;
    return KEYBIND_DEFS.some(def=>def.action!==action&&KEYBINDS[def.action]===code);
  }
  function canonicalForEvent(code){
    const found=KEYBIND_DEFS.find(def=>KEYBINDS[def.action]===code);
    return found?.canonical||null;
  }
  function matchesKeybind(event,action){
    return KEYBINDS[action]===event.code;
  }
  function getItemDescription(id,stack=null){
    const t=TOOL_STATS[id];
    let desc='';
    if(t){
      desc=t.type==='blade'
      ?`Attack Damage: ${t.atk}\nAttack Speed: ${t.speed.toFixed(2)}`
      :`Attack Damage: ${t.atk}\nEfficiency Rate: ${t.eff}%`;
    }
    const s=stack&&stack.id===id?stack:null;
    const food=FOOD_STATS[id];
    if(food){
      if(desc)desc+='\n────────\n';
      desc+=`Food Type: ${id===IT.ROTTEN_FLESH?'Rotten':'Edible'}\nNutrition: ${food.nutrition}/10`;
      desc+=`\nSaturation: ${food.sat.toFixed(1)}\nEat Time: ${getFoodEatDuration(id).toFixed(1)}s`;
      if(!food.bad)desc+=`\nFullness Grace: ${Math.round(getFoodHungerPause(id))}s`;
      if(food.bad)desc+='\nMay cause harm';
    }
    if(s&&isDurableItemId(id)){
      if(desc)desc+='\n────────\n';
      desc+=`Durability: ${formatCompactNumber(s.dur)} / ${formatCompactNumber(s.maxDur)}`;
    }
    return desc;
   }
   
   // Break times (seconds, fist)
   const BREAK_TIME={
     [B.GRASS]:0.9,[B.DIRT]:0.75,[B.SAND]:0.75,[B.GRAVEL]:0.75,[B.RED_SAND]:0.75,[B.GRASS_PATH]:0.72,[B.FARMLAND_DRY]:0.7,[B.FARMLAND_WET]:0.7,
     [B.STONE]:4.2,[B.COBBLESTONE]:3.8,[B.COAL_ORE]:4.4,[B.IRON_ORE]:4.6,
     [B.GOLD_ORE]:4.8,[B.DIAMOND_ORE]:5.2,
    [B.WOOD]:3.0,[B.LEAVES]:0.5,[B.PLANKS]:2.0,[B.BED]:1.4,[B.CRAFTING_TABLE]:3.0,[B.CHEST]:2.6,[B.IRON_CHEST]:3.4,[B.GOLD_CHEST]:3.6,[B.DIAMOND_CHEST]:4.5,[B.DEV_CHEST]:Infinity,[B.TNT]:0.9,[B.IRON_BLOCK]:6.0,[B.GOLD_BLOCK]:6.0,[B.DIAMOND_BLOCK]:6.5,[B.TORCH]:0,[B.FIRE]:0,[B.OAK_SLAB]:1.6,[B.STONE_SLAB]:2.2,[B.COBBLE_SLAB]:2.0,
     [B.BEDROCK]:Infinity,[B.WATER]:Infinity,[B.LAVA]:Infinity,
   };
   for(let i=0;i<WOOL_COLORS.length;i++)BREAK_TIME[WOOL_BASE_ID+i]=0.65;
   const BLAST_RESISTANCE={
    [B.AIR]:0,[B.FIRE]:0,[B.TORCH]:0.1,[B.LEAVES]:0.2,[B.TNT]:0,
    [B.GRASS]:0.8,[B.DIRT]:0.8,[B.GRASS_PATH]:0.8,[B.FARMLAND_DRY]:0.7,[B.FARMLAND_WET]:0.8,[B.SAND]:0.7,[B.RED_SAND]:0.7,[B.GRAVEL]:0.8,
    [B.WATER]:500,[B.LAVA]:500,[B.WOOD]:2,[B.PLANKS]:2,[B.BED]:1.2,[B.CRAFTING_TABLE]:2.5,[B.CHEST]:2.5,[B.IRON_CHEST]:8,[B.GOLD_CHEST]:7,[B.DIAMOND_CHEST]:12,[B.DEV_CHEST]:1200,
    [B.STONE]:6,[B.COBBLESTONE]:6,[B.COAL_ORE]:4,[B.IRON_ORE]:4.5,[B.GOLD_ORE]:4.5,[B.DIAMOND_ORE]:5,
    [B.IRON_BLOCK]:10,[B.GOLD_BLOCK]:9,[B.DIAMOND_BLOCK]:12,[B.BEDROCK]:99999,[B.OAK_SLAB]:2,[B.STONE_SLAB]:6,[B.COBBLE_SLAB]:6,
   };
   for(let i=0;i<WOOL_COLORS.length;i++)BLAST_RESISTANCE[WOOL_BASE_ID+i]=0.8;
   
   // Drop table: blockId → [{id, count, chance}]
   const DROP_TABLE={
     [B.GRASS]:   [{id:B.DIRT,count:1,ch:1}],
     [B.DIRT]:    [{id:B.DIRT,count:1,ch:1}],
     [B.STONE]:   [{id:B.COBBLESTONE,count:1,ch:1}],
     [B.COBBLESTONE]:[{id:B.COBBLESTONE,count:1,ch:1}],
     [B.SAND]:    [{id:B.SAND,count:1,ch:1}],
    [B.GRAVEL]:  [{id:B.GRAVEL,count:1,ch:1},{id:IT.FLINT,count:1,ch:0.2}],
     [B.RED_SAND]:[{id:B.RED_SAND,count:1,ch:1}],
     [B.WOOD]:    [{id:B.WOOD,count:1,ch:1}],
     [B.LEAVES]:  [{id:B.LEAVES,count:1,ch:0.2}],
     [B.PLANKS]:  [{id:B.PLANKS,count:1,ch:1}],
     [B.CRAFTING_TABLE]: [{id:B.CRAFTING_TABLE,count:1,ch:1}],
     [B.CHEST]: [{id:B.CHEST,count:1,ch:1}],
     [B.DIAMOND_CHEST]: [{id:B.DIAMOND_CHEST,count:1,ch:1}],
     [B.IRON_CHEST]: [{id:B.IRON_CHEST,count:1,ch:1}],
     [B.GOLD_CHEST]: [{id:B.GOLD_CHEST,count:1,ch:1}],
    [B.DEV_CHEST]: [{id:B.DEV_CHEST,count:1,ch:1}],
    [B.OAK_SLAB]: [{id:B.OAK_SLAB,count:1,ch:1}],
    [B.STONE_SLAB]: [{id:B.STONE_SLAB,count:1,ch:1}],
    [B.COBBLE_SLAB]: [{id:B.COBBLE_SLAB,count:1,ch:1}],
     [B.TNT]: [{id:B.TNT,count:1,ch:1}],
     [B.IRON_BLOCK]: [{id:B.IRON_BLOCK,count:1,ch:1}],
     [B.GOLD_BLOCK]: [{id:B.GOLD_BLOCK,count:1,ch:1}],
     [B.DIAMOND_BLOCK]: [{id:B.DIAMOND_BLOCK,count:1,ch:1}],
    [B.TORCH]: [{id:B.TORCH,count:1,ch:1}],
    [B.BED]: [{id:IT.BED,count:1,ch:1}],
    [B.FIRE]: [],
    [B.GRASS_PATH]: [{id:B.DIRT,count:1,ch:1}],
    [B.FARMLAND_DRY]: [{id:B.DIRT,count:1,ch:1}],
    [B.FARMLAND_WET]: [{id:B.DIRT,count:1,ch:1}],
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
    saturation:8,maxSaturation:20,
  };
  let hungerPauseT=0;
  let healFlashT=0;
  let hurtFlashT=0;
  let hiddenPauseNotified=false;
  let eatAction={active:false,slot:-1,itemId:0,time:0,total:0};
  const PERF_STATE={renderScale:1,lowFpsT:0,highFpsT:0};
  const POINTER_STATE={primary:false,secondary:false};
  let sleeping={active:false,timer:0,duration:1.35,wx:0,wy:0,wz:0,dir:0,otherKey:null};
  function getFoodEatDuration(id){
    const f=FOOD_STATS[id];
    if(!f)return 0;
    return Math.max(0.9,Math.min(1.8,0.7+(f.nutrition*0.04)+(f.sat*0.05)));
  }
  function getFoodHungerPause(id){
    const f=FOOD_STATS[id];
    if(!f||f.bad)return 0;
    return Math.max(12,Math.min(180,18+(f.nutrition*8)+(f.sat*10)));
  }
  function applyDamage(amount,bypassShield=false){
    let dmg=Math.max(0,Number(amount)||0);
    if(dmg<=0)return;
    if(!bypassShield&&STATS.shield>0){
      const absorbed=Math.min(STATS.shield,dmg);
      STATS.shield-=absorbed;
      dmg-=absorbed;
    }
    if(dmg>0){
      STATS.health=Math.max(0,STATS.health-dmg);
      hurtFlashT=Math.min(1.2,hurtFlashT+0.16+dmg*0.012);
    }
  }
   
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
   let CURRENT_WORLD_ID='default';
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
   window.addEventListener('wheel',e=>{if(e.ctrlKey)e.preventDefault();},{passive:false});
   window.addEventListener('gesturestart',e=>e.preventDefault(),{passive:false});
   window.addEventListener('gesturechange',e=>e.preventDefault(),{passive:false});
   
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
     t.wrapS=THREE.ClampToEdgeWrapping;t.wrapT=THREE.ClampToEdgeWrapping;
     return t;
   }
   function rng(s){let v=s+1;return()=>{v=(v*16807)%2147483647;return(v-1)/2147483646;};}
   
   const TEX={};
   
   // Grass TOP — plain solid
   TEX.grassTop=makeTex(g=>{
     g.fillStyle='#5aaa3c';g.fillRect(0,0,16,16);
   });
   
  // Grass SIDE — full grass texture (no dirt curve)
  TEX.grassSide=makeTex(g=>{
    g.fillStyle='#4f9a38';g.fillRect(0,0,16,16);
    const r=rng(2);
    for(let i=0;i<46;i++){
      const v=(r()*20-10)|0;
      g.fillStyle=`rgb(${86+v},${170+v},${58+v})`;
      g.fillRect((r()*15)|0,(r()*15)|0,1+(r()*2)|0,1+(r()*2)|0);
    }
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
   
   // Low-cost water frames with directional lines
   TEX.waterFrames=[];
  for(let f=0;f<4;f++){
    TEX.waterFrames.push(makeTex(g=>{
      g.fillStyle='#2f8fd1';g.fillRect(0,0,16,16);
      for(let y=0;y<16;y++){
        const off=(y+f*2)%4;
        const vv=(y%2===0)?22:10;
        g.fillStyle=`rgb(${66+vv},${156+vv},${220+vv})`;
        for(let x=off;x<16;x+=4)g.fillRect(x,y,2,1);
      }
    }));
  }

  TEX.lavaFrames=[];
  for(let f=0;f<8;f++){
    TEX.lavaFrames.push(makeTex(g=>{
      for(let y=0;y<16;y++)for(let x=0;x<16;x++){
        const wave=Math.sin((x-f*0.8)*0.7)+Math.cos((y+f*1.1)*0.65);
        const noise=frac(Math.abs(h2(x*17-f*9,y*19+f*3)));
        const v=Math.max(0,Math.min(1,0.52+wave*0.14+(noise-0.5)*0.24));
        const rr=(190+v*65)|0,gg=(35+v*115)|0;
        g.fillStyle=`rgb(${rr},${gg},0)`;g.fillRect(x,y,1,1);
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

  TEX.smallChestSide=makeTex(g=>{g.fillStyle='#8b5a2b';g.fillRect(0,0,16,16);g.fillStyle='#5a3a1a';g.fillRect(0,0,16,3);g.fillRect(0,13,16,3);g.fillStyle='#b98b4e';g.fillRect(0,6,16,2);g.fillRect(0,9,16,1);g.fillStyle='#d8b87a';g.fillRect(7,7,2,3);});
  TEX.smallChestTop=makeTex(g=>{g.fillStyle='#9a6a38';g.fillRect(0,0,16,16);g.fillStyle='#6a441f';g.fillRect(0,2,16,2);g.fillRect(0,12,16,2);g.fillStyle='rgba(255,255,255,0.18)';g.fillRect(1,4,14,1);});
  TEX.largeChestSide=makeTex(g=>{g.fillStyle='#7f4f24';g.fillRect(0,0,16,16);g.fillStyle='#563517';g.fillRect(0,0,16,2);g.fillRect(0,14,16,2);g.fillStyle='#b48447';g.fillRect(0,6,16,3);g.fillStyle='#e0be79';g.fillRect(3,7,2,4);g.fillRect(11,7,2,4);});
  TEX.largeChestTop=makeTex(g=>{g.fillStyle='#8f5f30';g.fillRect(0,0,16,16);g.fillStyle='#6b431f';g.fillRect(0,1,16,2);g.fillRect(0,13,16,2);g.fillStyle='#c7985a';g.fillRect(0,7,16,2);});
  TEX.ironChest=makeTex(g=>{g.fillStyle='#9aa2ab';g.fillRect(0,0,16,16);g.fillStyle='#cfd5de';g.fillRect(0,0,16,3);g.fillStyle='#5c6168';g.fillRect(0,13,16,3);g.fillStyle='#e8ecf2';g.fillRect(3,7,2,3);g.fillRect(11,7,2,3);});
  TEX.goldChest=makeTex(g=>{g.fillStyle='#bf8b18';g.fillRect(0,0,16,16);g.fillStyle='#f0cb55';g.fillRect(0,0,16,3);g.fillStyle='#7d5a0d';g.fillRect(0,13,16,3);g.fillStyle='#ffe184';g.fillRect(3,7,2,3);g.fillRect(11,7,2,3);});
  TEX.diamondChest=makeTex(g=>{g.fillStyle='#38b3c8';g.fillRect(0,0,16,16);g.fillStyle='#7ff2ff';g.fillRect(0,0,16,3);g.fillStyle='#146a7a';g.fillRect(0,13,16,3);g.fillStyle='#b9fbff';g.fillRect(3,7,2,3);g.fillRect(11,7,2,3);});
  TEX.devChest=makeTex(g=>{g.fillStyle='#3d2066';g.fillRect(0,0,16,16);g.fillStyle='#8f6bf2';g.fillRect(0,0,16,3);g.fillStyle='#211035';g.fillRect(0,13,16,3);g.fillStyle='#d2c3ff';g.fillRect(7,6,2,4);});
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
  TEX.fire=makeTex(g=>{
    g.clearRect(0,0,16,16);
    g.fillStyle='rgba(255,140,0,0.95)';
    g.fillRect(6,3,4,11);
    g.fillStyle='rgba(255,210,80,0.95)';
    g.fillRect(7,1,2,8);
    g.fillStyle='rgba(255,60,0,0.7)';
    g.fillRect(4,7,2,6);g.fillRect(10,8,2,5);
  });
  TEX.bedTop=makeTex(g=>{g.fillStyle='#6a2fa2';g.fillRect(0,0,16,16);g.fillStyle='#9f73d8';g.fillRect(1,1,14,6);g.fillStyle='#e8e1f5';g.fillRect(5,2,6,3);g.fillStyle='#2a183f';g.fillRect(0,12,16,4);});
  TEX.bedSide=makeTex(g=>{g.fillStyle='#4d2c1a';g.fillRect(0,0,16,16);g.fillStyle='#6a2fa2';g.fillRect(0,0,16,9);g.fillStyle='#9f73d8';g.fillRect(1,1,14,3);});
  TEX.flint=makeTex(g=>{
    g.clearRect(0,0,16,16);
    g.fillStyle='#4d4d4d';g.fillRect(4,4,8,8);
    g.fillStyle='#8a8a8a';g.fillRect(5,5,3,2);g.fillRect(8,8,2,3);
  });
  TEX.flintSteel=makeTex(g=>{
    g.clearRect(0,0,16,16);
    g.fillStyle='#9f9f9f';g.fillRect(3,3,7,3);g.fillRect(7,6,2,7);
    g.fillStyle='#4d4d4d';g.fillRect(9,8,4,2);
    g.fillStyle='#f3c74f';g.fillRect(11,4,2,3);
  });

  function makeToolTex(head='#b0832e',handle='#7a5230',shape='pick'){
    return makeTex(g=>{
      g.clearRect(0,0,16,16);
      g.fillStyle=handle;g.fillRect(7,4,2,12);
      g.fillStyle=head;
      if(shape==='pick'){g.fillRect(2,3,12,3);g.fillRect(7,3,2,3);} 
      else if(shape==='axe'){g.fillRect(3,2,8,5);g.fillRect(9,3,3,2);} 
      else if(shape==='shovel'){g.fillRect(6,1,4,5);g.fillRect(7,6,2,2);}
      else if(shape==='hoe'){g.fillRect(4,2,6,3);g.fillRect(8,5,2,1);}
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
  TEX.woodShovel=makeToolTex('#a37431','#7a5230','shovel');
  TEX.stoneShovel=makeToolTex('#8d8d8d','#7a5230','shovel');
  TEX.ironShovel=makeToolTex('#c9c9c9','#7a5230','shovel');
  TEX.goldShovel=makeToolTex('#f0c040','#7a5230','shovel');
  TEX.diamondShovel=makeToolTex('#61e1e1','#7a5230','shovel');
  TEX.woodHoe=makeToolTex('#a37431','#7a5230','hoe');
  TEX.stoneHoe=makeToolTex('#8d8d8d','#7a5230','hoe');
  TEX.ironHoe=makeToolTex('#c9c9c9','#7a5230','hoe');
  TEX.goldHoe=makeToolTex('#f0c040','#7a5230','hoe');
  TEX.diamondHoe=makeToolTex('#61e1e1','#7a5230','hoe');
  TEX.shears=makeTex(g=>{
    g.strokeStyle='#d9dde2';g.lineWidth=2;
    g.beginPath();g.moveTo(4,4);g.lineTo(11,11);g.moveTo(11,4);g.lineTo(6,9);g.stroke();
    g.fillStyle='#8aa2d9';g.beginPath();g.arc(4,12,2,0,Math.PI*2);g.fill();
    g.fillStyle='#e07a7a';g.beginPath();g.arc(12,12,2,0,Math.PI*2);g.fill();
  });
  TEX.bow=makeTex(g=>{g.clearRect(0,0,16,16);g.strokeStyle='#8b5a34';g.lineWidth=2;g.beginPath();g.moveTo(11,2);g.quadraticCurveTo(4,8,11,14);g.stroke();g.strokeStyle='#ddd';g.lineWidth=1;g.beginPath();g.moveTo(10,2);g.lineTo(10,14);g.stroke();});
  TEX.arrow=makeTex(g=>{g.clearRect(0,0,16,16);g.fillStyle='#ddd';g.fillRect(7,1,2,10);g.fillStyle='#bbb';g.fillRect(5,9,6,2);g.fillStyle='#8b5a34';g.fillRect(7,11,2,4);});
  TEX.bucket=makeTex(g=>{g.fillStyle='#9ca5ad';g.fillRect(3,4,10,10);g.fillStyle='#c9d1d8';g.fillRect(4,5,8,2);g.strokeStyle='#e4eaef';g.strokeRect(4,2,8,3);});
  TEX.waterBucket=makeTex(g=>{g.drawImage(TEX.bucket.image,0,0);g.fillStyle='#3b99de';g.fillRect(4,8,8,5);});
  TEX.lavaBucket=makeTex(g=>{g.drawImage(TEX.bucket.image,0,0);g.fillStyle='#e36b1c';g.fillRect(4,8,8,5);});
  const makeFoodTex=(base,hi)=>makeTex(g=>{g.fillStyle=base;g.fillRect(3,4,10,8);g.fillStyle=hi;g.fillRect(4,5,6,3);});
  TEX.porkRaw=makeFoodTex('#d98994','#f4b0b8');TEX.porkCooked=makeFoodTex('#8f4a2f','#c06a43');
  TEX.lambRaw=makeFoodTex('#d67a6e','#efad9f');TEX.lambCooked=makeFoodTex('#8a4c38','#c47b56');
  TEX.beefRaw=makeFoodTex('#b65447','#dc8577');TEX.beefCooked=makeFoodTex('#6f3b2b','#a85b41');
  TEX.chickenRaw=makeFoodTex('#e9cfb1','#fff1d5');TEX.chickenCooked=makeFoodTex('#a66a32','#df9c51');
  TEX.rottenFlesh=makeFoodTex('#7c6f67','#92827a');
  TEX.grassPathTop=makeTex(g=>{g.fillStyle='#7f6440';g.fillRect(0,0,16,16);g.fillStyle='#8f7450';for(let i=0;i<20;i++)g.fillRect((Math.random()*16)|0,(Math.random()*16)|0,1,1);});
  TEX.grassPathSide=makeTex(g=>{g.drawImage(TEX.dirt.image,0,0);g.fillStyle='#7f6440';g.fillRect(0,0,16,3);});
  TEX.farmlandDryTop=makeTex(g=>{g.fillStyle='#a07849';g.fillRect(0,0,16,16);g.fillStyle='#ba8c57';for(let y=2;y<16;y+=3)g.fillRect(0,y,16,1);});
  TEX.farmlandDrySide=makeTex(g=>{g.drawImage(TEX.dirt.image,0,0);g.fillStyle='#a07849';g.fillRect(0,0,16,3);});
  TEX.farmlandWetTop=makeTex(g=>{g.fillStyle='#714a2d';g.fillRect(0,0,16,16);g.fillStyle='#8a5a35';for(let y=2;y<16;y+=3)g.fillRect(0,y,16,1);});
  TEX.farmlandWetSide=makeTex(g=>{g.drawImage(TEX.dirt.image,0,0);g.fillStyle='#714a2d';g.fillRect(0,0,16,3);});
  TEX.zombieSkin=makeTex(g=>{
    g.fillStyle='#5ea85f';g.fillRect(0,0,16,16);
    g.fillStyle='#4d8f4e';g.fillRect(0,10,16,6);
    g.fillStyle='#1b1b1b';g.fillRect(3,4,2,2);g.fillRect(11,4,2,2);
    g.fillStyle='#6fb870';g.fillRect(5,7,6,3);
  });
  TEX.zombieShirt=makeTex(g=>{g.fillStyle='#2d6bb0';g.fillRect(0,0,16,16);g.fillStyle='#3d7bc4';g.fillRect(2,2,12,12);});
  TEX.zombiePants=makeTex(g=>{g.fillStyle='#413ca7';g.fillRect(0,0,16,16);g.fillStyle='#5753c3';g.fillRect(2,0,12,16);});
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
  BLOCK_NAMES[B.OAK_SLAB]='Oak Slab';
  BLOCK_NAMES[B.STONE_SLAB]='Stone Slab';
  BLOCK_NAMES[B.COBBLE_SLAB]='Cobblestone Slab';
   
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
     [B.CHEST]:{top:TEX.smallChestTop,bot:TEX.smallChestTop,side:TEX.smallChestSide},
     [B.IRON_CHEST]:{top:TEX.ironChest,bot:TEX.ironChest,side:TEX.ironChest},
     [B.GOLD_CHEST]:{top:TEX.goldChest,bot:TEX.goldChest,side:TEX.goldChest},
     [B.DIAMOND_CHEST]:{top:TEX.diamondChest,bot:TEX.diamondChest,side:TEX.diamondChest},
     [B.DEV_CHEST]:{top:TEX.devChest,bot:TEX.devChest,side:TEX.devChest},
     [B.TNT]:{top:TEX.tntTop,bot:TEX.tntTop,side:TEX.tntSide},
     [B.IRON_BLOCK]:{top:TEX.ironBlock,bot:TEX.ironBlock,side:TEX.ironBlock},
     [B.GOLD_BLOCK]:{top:TEX.goldBlock,bot:TEX.goldBlock,side:TEX.goldBlock},
     [B.DIAMOND_BLOCK]:{top:TEX.diamondBlock,bot:TEX.diamondBlock,side:TEX.diamondBlock},
     [B.COBBLESTONE]:{top:TEX.cobblestone,bot:TEX.cobblestone,side:TEX.cobblestone},
     [B.RED_SAND]:{top:TEX.redSand,bot:TEX.redSand,side:TEX.redSand},
     [B.TORCH]:{top:TEX.torch,bot:TEX.torch,side:TEX.torch},
    [B.BED]:{top:TEX.bedTop,bot:TEX.planks,side:TEX.bedSide},
     [B.FIRE]:{top:TEX.fire,bot:TEX.fire,side:TEX.fire},
     [B.GRASS_PATH]:{top:TEX.grassPathTop,bot:TEX.dirt,side:TEX.grassPathSide},
     [B.FARMLAND_DRY]:{top:TEX.farmlandDryTop,bot:TEX.dirt,side:TEX.farmlandDrySide},
     [B.FARMLAND_WET]:{top:TEX.farmlandWetTop,bot:TEX.dirt,side:TEX.farmlandWetSide},
     [B.OAK_SLAB]:{top:TEX.planks,bot:TEX.planks,side:TEX.planks},
     [B.STONE_SLAB]:{top:TEX.stone,bot:TEX.stone,side:TEX.stone},
     [B.COBBLE_SLAB]:{top:TEX.cobblestone,bot:TEX.cobblestone,side:TEX.cobblestone},
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
     [IT.BOAT]:TEX.boat,[IT.FLINT]:TEX.flint,[IT.FLINT_STEEL]:TEX.flintSteel,[IT.BOW]:TEX.bow,[IT.ARROW]:TEX.arrow,
     [IT.WOOD_SHOVEL]:TEX.woodShovel,[IT.STONE_SHOVEL]:TEX.stoneShovel,[IT.IRON_SHOVEL]:TEX.ironShovel,[IT.GOLD_SHOVEL]:TEX.goldShovel,[IT.DIAMOND_SHOVEL]:TEX.diamondShovel,
     [IT.WOOD_HOE]:TEX.woodHoe,[IT.STONE_HOE]:TEX.stoneHoe,[IT.IRON_HOE]:TEX.ironHoe,[IT.GOLD_HOE]:TEX.goldHoe,[IT.DIAMOND_HOE]:TEX.diamondHoe,
     [IT.SHEARS]:TEX.shears,
     [IT.BUCKET]:TEX.bucket,[IT.WATER_BUCKET]:TEX.waterBucket,[IT.LAVA_BUCKET]:TEX.lavaBucket,[IT.BED]:TEX.bedTop,
     [IT.PORKCHOP_RAW]:TEX.porkRaw,[IT.PORKCHOP_COOKED]:TEX.porkCooked,[IT.LAMB_RAW]:TEX.lambRaw,[IT.LAMB_COOKED]:TEX.lambCooked,[IT.BEEF_RAW]:TEX.beefRaw,[IT.BEEF_COOKED]:TEX.beefCooked,[IT.ROTTEN_FLESH]:TEX.rottenFlesh,[IT.CHICKEN_RAW]:TEX.chickenRaw,[IT.CHICKEN_COOKED]:TEX.chickenCooked,
   };
   function getItemTex(id){
     if(id<100) return (BLOCK_TEX[id]||BLOCK_TEX[B.STONE]).top;
     return ITEM_TEX[id]||TEX.stone;
   }
   
   const matCache={};
   function getMats(id){
     if(matCache[id]) return matCache[id];
     const bt=BLOCK_TEX[id]||BLOCK_TEX[B.STONE];
    const tr=id===B.LEAVES||id===B.WATER||id===B.LAVA||id===B.TORCH||id===B.FIRE;
   const op={transparent:tr,opacity:id===B.WATER?0.76:id===B.LEAVES?0.86:1,side:THREE.DoubleSide,depthWrite:!tr,alphaTest:(id===B.TORCH||id===B.FIRE)?0.08:0};
     const base=tr?op:{side:THREE.DoubleSide};
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
    requestWorldSave();
  }
  function isSolid(id){
    return id!==B.AIR&&id!==B.LEAVES&&id!==B.WATER&&id!==B.LAVA&&id!==B.TORCH&&id!==B.FIRE;
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
    const curve=octNoise(wx*0.022+wz*0.009,wy*0.033+wz*0.016,3,2,0.54);
    const curve2=octNoise(wx*0.014-wz*0.019+130,wy*0.031+wx*0.011+70,3,2,0.54);
    const verticalBias=Math.max(0,1-Math.abs((wy-28)/28));
    if(curve*curve+curve2*curve2<0.015+(verticalBias*0.004))return true;
    const shaft=octNoise(wx*0.012+210,wz*0.012-90,2,2,0.5);
    if(Math.abs(shaft)<0.024&&wy>6&&wy<54)return true;
    const ravine=getRavineProfile(wx,wz);
    if(ravine&&wy>ravine.bottom&&wy<ravine.top){
      const axisOff=ravine.orient==='x'?Math.abs(wz-ravine.axis):Math.abs(wx-ravine.axis);
      const width=ravine.half*(1-(wy-ravine.bottom)/(ravine.top-ravine.bottom)*0.55);
      if(axisOff<Math.max(1.2,width))return true;
    }
    return false;
  }
   
   // Tree variants
   function treeSize(wx,wz){
     const r=frac(Math.abs(h2(wx*5.3,wz*4.7)));
     if(r<0.3)return 'sm'; if(r<0.75)return 'md'; return 'lg';
   }
   function treeSpacingRadius(size){
     return size==='lg'?5:(size==='md'?4:3);
   }
   function canSpawnTreeAt(wx,wz,size){
     const radius=treeSpacingRadius(size);
     for(let dx=-radius;dx<=radius;dx++)for(let dz=-radius;dz<=radius;dz++){
       if(dx===0&&dz===0)continue;
       if(dx*dx+dz*dz>radius*radius)continue;
       if(frac(Math.abs(h2((wx+dx)*3.1+1,(wz+dz)*2.9+2)))>=0.02)continue;
       const otherSize=treeSize(wx+dx,wz+dz);
       if(treeSpacingRadius(otherSize)>=Math.max(2,Math.hypot(dx,dz)-0.15))return false;
     }
     return true;
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
    if(mode==='ultra')return 1.2;
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
    if(seed>=0.012)return null;
    const orient=seed<0.009?'x':'z';
    const axis=orient==='x'?Math.floor(baseZ/6)*6:Math.floor(base/6)*6;
    const widthN=frac(Math.abs(h2(base+777,baseZ+333)));
    const half=widthN<0.33?1.4:(widthN<0.76?1.9:2.5);
    const tallN=frac(Math.abs(h2(base-91,baseZ+517)));
    const top=tallN<0.2?28:(tallN<0.82?42:58);
    const depth=tallN<0.2?12:(tallN<0.82?20:28);
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
        const flowy=frac(Math.abs(h2(wx*0.91+12,wz*0.77-31)))<0.42;
        for(let dlx=-3;dlx<=3;dlx++)for(let dlz=-3;dlz<=3;dlz++){
          const nx=dlx/3,nz=dlz/3;
          const curve=nx*nx+nz*nz;
          if(curve>1)continue;
          const depth=curve<0.35?2:1;
          const lx2=lx+dlx,lz2=lz+dlz;
          if(lx2<0||lx2>=16||lz2<0||lz2>=16)continue;
          for(let d=0;d<depth;d++)arr[vKey(lx2,ly-d,lz2)]=B.LAVA;
          if(ly+1<CFG.chunkH)arr[vKey(lx2,ly+1,lz2)]=flowy&&curve<0.8?B.LAVA:B.AIR;
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

      // Underground water caves: favor ocean biomes and keep them mostly flooded instead of hollow drop caves
      if(h<=CFG.seaLevel&&h>18&&frac(Math.abs(h2(wx*0.83-55,wz*1.12+41)))<0.0024){
        const waterY=Math.max(9,Math.min(h-6,18+((frac(Math.abs(h2(wx*2.2,wz*2.4)))*8)|0)));
        for(let dlx=-3;dlx<=3;dlx++)for(let dlz=-3;dlz<=3;dlz++){
          const lx2=lx+dlx,lz2=lz+dlz;
          if(lx2<0||lx2>=16||lz2<0||lz2>=16)continue;
          const r=(dlx*dlx)/(4.2*4.2)+(dlz*dlz)/(4.2*4.2);
          if(r>1)continue;
          for(let y=waterY;y<=Math.min(waterY+3,CFG.chunkH-1);y++)arr[vKey(lx2,y,lz2)]=B.WATER;
          if(r<0.32&&waterY+4<CFG.chunkH)arr[vKey(lx2,waterY+4,lz2)]=B.AIR;
        }
      }

       // Oak tree

       const tdChance=0.02;
       if(h>CFG.seaLevel+1&&frac(Math.abs(h2(wx*3.1+1,wz*2.9+2)))<tdChance){
        const ground=arr[vKey(lx,h,lz)];
        if(!(ground===B.GRASS||ground===B.DIRT))continue;
         const sz=treeSize(wx,wz);
         if(!canSpawnTreeAt(wx,wz,sz))continue;
         const trunkH=sz==='sm'?3:sz==='md'?5:7;
         const leafR=sz==='sm'?2:sz==='md'?3:4;
         const leafH=sz==='sm'?4:sz==='md'?5:6;
         const base=h+1;
         for(let ty=base;ty<base+trunkH&&ty<CFG.chunkH;ty++)arr[vKey(lx,ty,lz)]=B.WOOD;
         for(let lfz=-leafR;lfz<=leafR;lfz++)for(let lfx=-leafR;lfx<=leafR;lfx++)for(let lft=-2;lft<=leafH;lft++){
           const flx=lx+lfx,flz=lz+lfz,fly=base+trunkH-1+lft;
           const dist=(Math.abs(lfx)+Math.abs(lfz))*0.75+Math.max(0,lft-1)*0.45;
           if(flx>=0&&flx<16&&flz>=0&&flz<16&&fly<CFG.chunkH&&dist<=leafR+1.2)
             if(arr[vKey(flx,fly,flz)]===B.AIR&&frac(Math.abs(h2(wx*13+lfx*7+fly,wz*11+lfz*5)))<leavesQualityChance())arr[vKey(flx,fly,flz)]=B.LEAVES;
         }
         if(base+trunkH<CFG.chunkH)arr[vKey(lx,base+trunkH,lz)]=B.LEAVES;
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
   function showFace(s,n,faceDir=null){
     if(s===B.AIR)return false;
     if(n===B.AIR)return true;
     if(s===B.TORCH&&n===B.TORCH)return false;
     if(faceDir&&faceDir[1]===0&&getBlockHeight(s)>getBlockHeight(n)+0.001)return true;
     if((s===B.WATER||s===B.LAVA)&&n!==s)return true;
     if(s===B.LEAVES&&n===B.AIR)return true;
     if(n===B.TORCH)return true;
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
        const x0=lx+0.375,x1=lx+0.625,z0=lz+0.375,z1=lz+0.625,y0=y,y1=y+0.75;
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
      if(self===B.FIRE){
        const d=getFD(self),base=d.pos.length/3;
        const cxm=lx+0.5,czm=lz+0.5,y0=y,y1=y+1;
        const quads=[
          [[cxm-0.38,y0,czm-0.38],[cxm-0.38,y1,czm-0.38],[cxm+0.38,y1,czm+0.38],[cxm+0.38,y0,czm+0.38]],
          [[cxm-0.38,y0,czm+0.38],[cxm-0.38,y1,czm+0.38],[cxm+0.38,y1,czm-0.38],[cxm+0.38,y0,czm-0.38]],
        ];
        for(let f=0;f<quads.length;f++){
          for(let i=0;i<4;i++){
            const v=quads[f][i];
            d.pos.push(v[0],v[1],v[2]);d.nor.push(0,1,0);d.uvs.push(QUV[i][0],QUV[i][1]);
          }
          const fb=base+f*4;d.idx.push(fb,fb+1,fb+2,fb,fb+2,fb+3);
        }
        continue;
      }
      if(self===B.BED){
        const meta=bedMetaGet(worldPosKey(wx,y,wz))||{};
        const d=getFD(self),base=d.pos.length/3;
        const h=0.56;
        const verts=[
          [lx+1,y,lz],[lx+1,y+h,lz],[lx+1,y+h,lz+1],[lx+1,y,lz+1],
          [lx,y,lz+1],[lx,y+h,lz+1],[lx,y+h,lz],[lx,y,lz],
          [lx,y+h,lz+1],[lx+1,y+h,lz+1],[lx+1,y+h,lz],[lx,y+h,lz],
          [lx,y,lz],[lx+1,y,lz],[lx+1,y,lz+1],[lx,y,lz+1],
          [lx+1,y,lz+1],[lx+1,y+h,lz+1],[lx,y+h,lz+1],[lx,y,lz+1],
          [lx,y,lz],[lx,y+h,lz],[lx+1,y+h,lz],[lx+1,y,lz],
        ];
        const norms=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
        for(let f=0;f<6;f++){
          for(let i=0;i<4;i++){
            const v=verts[f*4+i];d.pos.push(v[0],v[1],v[2]);d.nor.push(...norms[f]);d.uvs.push(QUV[i][0],QUV[i][1]);
          }
          const fb=base+f*4;d.idx.push(fb,fb+1,fb+2,fb,fb+2,fb+3);
        }
        const dir=meta.dir||0;
        const head=meta.part==='head';
        const headboardDepth=0.12;
        let hx0=lx,hx1=lx+1,hz0=lz,hz1=lz+1;
        if(dir===0){
          hz0=lz+1-headboardDepth;
          hz1=lz+1;
        }else if(dir===2){
          hz0=lz;
          hz1=lz+headboardDepth;
        }else if(dir===1){
          hx0=lx+1-headboardDepth;
          hx1=lx+1;
        }else{
          hx0=lx;
          hx1=lx+headboardDepth;
        }
        if(head){
          const bb=[[hx1,y+h,lz],[hx1,y+1.0,lz],[hx1,y+1.0,lz+1],[hx1,y+h,lz+1],[hx0,y+h,lz+1],[hx0,y+1.0,lz+1],[hx0,y+1.0,lz],[hx0,y+h,lz]];
          const start=d.pos.length/3;
          const faces=[[0,1,2,3],[4,5,6,7],[7,6,1,0],[3,2,5,4],[0,3,4,7],[6,5,2,1]];
          const ns=[[1,0,0],[-1,0,0],[0,0,-1],[0,0,1],[0,-1,0],[0,1,0]];
          faces.forEach((face,fi)=>{face.forEach((idx,i)=>{const v=bb[idx];d.pos.push(v[0],v[1],v[2]);d.nor.push(...ns[fi]);d.uvs.push(QUV[i][0],QUV[i][1]);});const fb=start+fi*4;d.idx.push(fb,fb+1,fb+2,fb,fb+2,fb+3);});
        }
        continue;
      }
      if(self===B.OAK_SLAB||self===B.STONE_SLAB||self===B.COBBLE_SLAB||self===B.GRASS_PATH||self===B.FARMLAND_DRY||self===B.FARMLAND_WET){
        const d=getFD(self),base=d.pos.length/3;
        const x0=lx,x1=lx+1,z0=lz,z1=lz+1,yy0=y,yy1=y+((self===B.OAK_SLAB||self===B.STONE_SLAB||self===B.COBBLE_SLAB)?0.5:0.9);
        const verts=[
          [x1,yy0,z0],[x1,yy1,z0],[x1,yy1,z1],[x1,yy0,z1],
          [x0,yy0,z1],[x0,yy1,z1],[x0,yy1,z0],[x0,yy0,z0],
          [x0,yy1,z1],[x1,yy1,z1],[x1,yy1,z0],[x0,yy1,z0],
          [x0,yy0,z0],[x1,yy0,z0],[x1,yy0,z1],[x0,yy0,z1],
          [x1,yy0,z1],[x1,yy1,z1],[x0,yy1,z1],[x0,yy0,z1],
          [x0,yy0,z0],[x0,yy1,z0],[x1,yy1,z0],[x1,yy0,z0],
        ];
        const norms=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
        for(let f=0;f<6;f++){
          for(let i=0;i<4;i++){
            const v=verts[f*4+i];d.pos.push(v[0],v[1],v[2]);d.nor.push(...norms[f]);d.uvs.push(QUV[i][0],QUV[i][1]);
          }
          const fb=base+f*4;d.idx.push(fb,fb+1,fb+2,fb,fb+2,fb+3);
        }
        continue;
      }
      const pairKey=(self===B.CHEST&&getPairKey(worldPosKey(wx,y,wz)))?'|large':'';
       const fdKey=(self===B.CHEST)?`${self}${pairKey}`:self;
       FACES.forEach(face=>{
         const [dx,dy,dz]=face.dir;
         const nx=lx+dx,ny=y+dy,nz=lz+dz;
         let nb;
         if(nx>=0&&nx<16&&nz>=0&&nz<16&&ny>=0&&ny<CFG.chunkH)nb=arr[vKey(nx,ny,nz)];
         else nb=worldGet(wx+dx,ny,wz+dz);
         if(!showFace(self,nb,face.dir))return;
         const d=getFD(fdKey),base=d.pos.length/3;
         face.c.forEach(([cx2,cy2,cz2],ci)=>{
           d.pos.push(lx+cx2,y+cy2,lz+cz2);d.nor.push(dx,dy,dz);d.uvs.push(QUV[ci][0],QUV[ci][1]);
         });
         d.idx.push(base,base+1,base+2,base,base+2,base+3);
       });
     }
     const grp=new THREE.Group();grp.position.set(cx*16,0,cz*16);
     Object.entries(fd).forEach(([idStr,d])=>{
       const id=parseInt(idStr,10);
       const useLargeChest=idStr===`${B.CHEST}|large`;
       const geo=new THREE.BufferGeometry();
       geo.setAttribute('position',new THREE.Float32BufferAttribute(d.pos,3));
       geo.setAttribute('normal',  new THREE.Float32BufferAttribute(d.nor,3));
       geo.setAttribute('uv',      new THREE.Float32BufferAttribute(d.uvs,2));
       geo.setIndex(d.idx);
       const mesh=new THREE.Mesh(geo,useLargeChest?new THREE.MeshLambertMaterial({map:TEX.largeChestSide,side:THREE.DoubleSide}):getMats(id)[0]);
       const sh=shadowsEnabled();mesh.castShadow=sh;mesh.receiveShadow=sh;
       grp.add(mesh);
     });
     scene.add(grp);chunkMeshes.set(key,grp);
    for(let lx=0;lx<16;lx++)for(let lz=0;lz<16;lz++)for(let y=1;y<CFG.chunkH;y++){
      if(arr[vKey(lx,y,lz)]!==B.TORCH)continue;
      const wx=cx*16+lx,wz=cz*16+lz;
      const lk=`${wx},${y},${wz}`;
      const light=new THREE.PointLight(0xffd27a,1.15,11,2.0);
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
   const skyMat=new THREE.MeshBasicMaterial({color:0x87ceeb,side:THREE.BackSide,depthWrite:false});
   scene.add(new THREE.Mesh(new THREE.SphereGeometry(480,8,8),skyMat));
   const starPositions=[];
   for(let i=0;i<320;i++){
    const v=new THREE.Vector3((Math.random()*2)-1,Math.random()*0.75+0.2,(Math.random()*2)-1).normalize().multiplyScalar(430);
    starPositions.push(v.x,v.y,v.z);
   }
   const starGeo=new THREE.BufferGeometry();
   starGeo.setAttribute('position',new THREE.Float32BufferAttribute(starPositions,3));
   const starMat=new THREE.PointsMaterial({color:0xffffff,size:2.1,sizeAttenuation:false,transparent:true,opacity:0,depthWrite:false});
   const starsMesh=new THREE.Points(starGeo,starMat);
   starsMesh.frustumCulled=false;
   scene.add(starsMesh);
   function makeMoonPhaseTex(phase=1){
    return makeTex((g,s)=>{
      g.clearRect(0,0,s,s);
      g.fillStyle='#e8edf7';g.beginPath();g.arc(s/2,s/2,s*0.44,0,Math.PI*2);g.fill();
      const p=((phase-1)%8+8)%8;
      if(p!==0&&p!==4){
        g.globalCompositeOperation='destination-out';
        const off=[0.55,0.3,0.12,0,0,0.12,0.3,0.55][p];
        const dir=p<4?1:-1;
        g.beginPath();g.arc(s/2+dir*s*off,s/2,s*0.44,0,Math.PI*2);g.fill();
        g.globalCompositeOperation='source-over';
      }else if(p===4){g.fillStyle='#10151f';g.beginPath();g.arc(s/2,s/2,s*0.42,0,Math.PI*2);g.fill();}
    },64);
   }
   TEX.sunDisc=makeTex((g,s)=>{
    const rg=g.createLinearGradient(0,0,s,s);
    rg.addColorStop(0,'#fff4a2');
    rg.addColorStop(1,'#f2a72d');
    g.fillStyle=rg;
    g.fillRect(0,0,s,s);
    g.strokeStyle='rgba(255,255,255,0.28)';
    g.strokeRect(1,1,s-2,s-2);
   },64);
   let moonPhase=1;
   TEX.moonDisc=makeMoonPhaseTex(moonPhase);
   const sunMat=new THREE.MeshBasicMaterial({map:TEX.sunDisc,color:0xffe27a,transparent:true,depthWrite:false,depthTest:true,side:THREE.DoubleSide,toneMapped:false});
   const moonMat=new THREE.MeshBasicMaterial({map:TEX.moonDisc,color:0xdfe8ff,transparent:true,depthWrite:false,depthTest:true,side:THREE.DoubleSide,toneMapped:false});
   const sunMesh=new THREE.Mesh(new THREE.PlaneGeometry(22,22),sunMat);
   const moonMesh=new THREE.Mesh(new THREE.PlaneGeometry(18,18),moonMat);
   sunMesh.frustumCulled=false;moonMesh.frustumCulled=false;sunMesh.renderOrder=2;moonMesh.renderOrder=2;
   scene.add(sunMesh);scene.add(moonMesh);
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
    requestWorldSave(250);
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
    scene.remove(boat);disposeObject3D(boat);
   }
  function angleDelta(target,current){
    let d=target-current;
    while(d>Math.PI)d-=Math.PI*2;
    while(d<-Math.PI)d+=Math.PI*2;
    return d;
  }
  function updateBoatPhysics(boat,dt,isRidden=false){
    const waterSurface=getBoatWaterSurfaceY(boat);
    const inWater=waterSurface!==null;
    if(inWater){
      const targetY=waterSurface-0.28+(Math.sin((performance.now()*0.001)+(boat.position.x*0.9)+(boat.position.z*0.7))*0.03);
      boat.userData.vy=(boat.userData.vy||0)+(targetY-boat.position.y)*10*dt;
      boat.userData.vy*=0.88;
      boat.position.y+=boat.userData.vy*dt;
      boat.rotation.z+=(-boat.rotation.z+Math.sin((performance.now()*0.001)+(boat.position.x*0.5))*0.035)*Math.min(1,dt*3.5);
      boat.rotation.x+=(-boat.rotation.x+Math.cos((performance.now()*0.001)+(boat.position.z*0.45))*0.022)*Math.min(1,dt*3.2);
    }else{
      boat.userData.vy=Math.max(-7,(boat.userData.vy||0)-16*dt);
      boat.position.y+=boat.userData.vy*dt;
      boat.rotation.z*=Math.max(0,1-dt*5);
      boat.rotation.x*=Math.max(0,1-dt*5);
    }
    if(!isRidden){
      boat.position.x+=(boat.userData.vx||0)*dt;
      boat.position.z+=(boat.userData.vz||0)*dt;
      boat.userData.vx=(boat.userData.vx||0)*(inWater?0.94:0.82);
      boat.userData.vz=(boat.userData.vz||0)*(inWater?0.94:0.82);
    }
    pushBoatOutOfSolids(boat);
  }
  function updateBoats(dt){
    if(isPaused)return;
    for(const boat of boats){
      if(boat===ridingBoat)continue;
      updateBoatPhysics(boat,dt,false);
    }
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
  function tryHitMob(){
    const origin=camera.position.clone();
    const dir=new THREE.Vector3(0,0,-1).applyEuler(camera.rotation).normalize();
    let best=null,bestT=3.2;
    for(const m of mobs){
      const hb=getMobHitboxBounds(m);
      const t=rayIntersectAabb(origin,dir,hb.min,hb.max,bestT);
      if(t<0||t>bestT)continue;
      best=m;bestT=t;
    }
    if(!best)return false;
    const dmg=Math.max(1,getAttackDamage());
    best.userData.hp-=dmg;
    best.userData.hurtT=0.25;
    if(best.userData.hp<=0)killMob(best,(best.userData.burnT||0)>0);
    consumeHeldToolDurability(1);
    return true;
  }
  function getTargetMob(maxDist=4.5){
    const origin=camera.position.clone();
    const dir=new THREE.Vector3(0,0,-1).applyEuler(camera.rotation).normalize();
    let best=null,bestT=maxDist;
    for(const m of mobs){
      const hb=getMobHitboxBounds(m);
      const t=rayIntersectAabb(origin,dir,hb.min,hb.max,bestT);
      if(t<0||t>bestT)continue;
      best=m;bestT=t;
    }
    return best;
  }
  const mobs=[];
  const MOB_DEF={
    zombie:{color:0x4f8f52,h:1.7,speed:1.5,hp:20,hostile:true,hitbox:{x:0.72,y:1.8,z:0.72}},
    pig:{color:0xf2a3b1,h:1.1,speed:1.0,hp:10,hitbox:{x:1.02,y:1.05,z:1.32}},
    cow:{color:0x6b4a32,h:1.4,speed:0.9,hp:14,hitbox:{x:1.16,y:1.42,z:1.48}},
    chicken:{color:0xf6f0d2,h:0.8,speed:1.1,hp:6,hitbox:{x:0.58,y:0.92,z:0.72}},
    sheep:{color:0xeaeaea,h:1.3,speed:0.95,hp:12,hitbox:{x:1.04,y:1.24,z:1.34}},
  };
  function pickSheepVariant(){
    const roll=Math.random();
    if(roll<0.46)return 0;
    if(roll<0.62)return 8;
    if(roll<0.76)return 7;
    if(roll<0.88)return 15;
    return Math.floor(Math.random()*WOOL_COLORS.length);
  }
  function getSheepWoolColor(variant=0){
    const hex=WOOL_COLORS[Math.max(0,Math.min(WOOL_COLORS.length-1,variant))]?.hex||'#f1f1f1';
    return parseInt(hex.replace('#',''),16);
  }
  function rayIntersectAabb(origin,dir,min,max,maxDist=Infinity){
    let tmin=0,tmax=maxDist;
    for(const axis of ['x','y','z']){
      const o=origin[axis],d=dir[axis];
      if(Math.abs(d)<1e-6){
        if(o<min[axis]||o>max[axis])return -1;
        continue;
      }
      const inv=1/d;
      let t1=(min[axis]-o)*inv,t2=(max[axis]-o)*inv;
      if(t1>t2){const tmp=t1;t1=t2;t2=tmp;}
      tmin=Math.max(tmin,t1);
      tmax=Math.min(tmax,t2);
      if(tmax<tmin)return -1;
    }
    return tmin;
  }
  function getMobHitboxBounds(m){
    const box=m?.userData?.hitbox||{x:0.8,y:1,z:0.8,offsetY:0.5};
    const halfX=(box.x||0.8)*0.5,halfZ=(box.z||0.8)*0.5;
    const min=new THREE.Vector3(m.position.x-halfX,m.position.y+(box.offsetY||0)-0.02,m.position.z-halfZ);
    const max=new THREE.Vector3(m.position.x+halfX,min.y+(box.y||1),m.position.z+halfZ);
    return {min,max};
  }
  function disposeObject3D(obj){
    if(!obj)return;
    obj.traverse(part=>{
      if(part.geometry)part.geometry.dispose();
      if(part.material){
        if(Array.isArray(part.material))part.material.forEach(m=>m?.dispose?.());
        else part.material.dispose?.();
      }
    });
  }
  function removeAndDisposeSceneObject(obj){
    if(!obj)return;
    scene.remove(obj);
    disposeObject3D(obj);
  }
  function createMobMaterial(color,map=null){
    return new THREE.MeshLambertMaterial({color,map,transparent:!!map,alphaTest:map?0.05:0});
  }
  function makeMobPart(w,h,d,color,x,y,z,parent,map=null){
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),createMobMaterial(color,map));
    mesh.position.set(x,y,z);
    parent.add(mesh);
    return mesh;
  }
  function createMobModel(type,variant=0){
    const root=new THREE.Group();
    const parts=[];
    const legColor=type==='chicken'?0xd39d42:(type==='sheep'?0x6d5d4c:(type==='cow'?0x4a3425:0xd78497));
    const sheepWool=getSheepWoolColor(variant);
    if(type==='pig'){
      parts.push(makeMobPart(0.92,0.58,1.26,0xf2a3b1,0,0.78,0,root));
      parts.push(makeMobPart(0.56,0.46,0.54,0xf2a3b1,0,1.08,0.6,root));
      parts.push(makeMobPart(0.28,0.18,0.12,0xe48a99,0,1.02,0.89,root));
      [[-0.24,0.33,-0.35],[0.24,0.33,-0.35],[-0.24,0.33,0.35],[0.24,0.33,0.35]].forEach(([x,y,z])=>parts.push(makeMobPart(0.16,0.66,0.16,legColor,x,y,z,root)));
    }else if(type==='cow'){
      parts.push(makeMobPart(1.08,0.7,1.45,0x6b4a32,0,0.92,0,root));
      parts.push(makeMobPart(0.58,0.6,0.62,0x6b4a32,0,1.15,0.83,root));
      parts.push(makeMobPart(0.2,0.14,0.18,0xcab59a,-0.18,1.03,1.13,root));
      parts.push(makeMobPart(0.2,0.14,0.18,0xcab59a,0.18,1.03,1.13,root));
      parts.push(makeMobPart(0.12,0.18,0.12,0xe9dfcf,-0.2,1.46,1.03,root));
      parts.push(makeMobPart(0.12,0.18,0.12,0xe9dfcf,0.2,1.46,1.03,root));
      [[-0.3,0.38,-0.42],[0.3,0.38,-0.42],[-0.3,0.38,0.42],[0.3,0.38,0.42]].forEach(([x,y,z])=>parts.push(makeMobPart(0.16,0.76,0.16,legColor,x,y,z,root)));
    }else if(type==='sheep'){
      parts.push(makeMobPart(1.06,0.76,1.38,sheepWool,0,0.96,0,root));
      parts.push(makeMobPart(0.54,0.5,0.56,0xd8d2cb,0,1.1,0.84,root));
      [[-0.28,0.37,-0.4],[0.28,0.37,-0.4],[-0.28,0.37,0.4],[0.28,0.37,0.4]].forEach(([x,y,z])=>parts.push(makeMobPart(0.15,0.74,0.15,legColor,x,y,z,root)));
    }else if(type==='chicken'){
      parts.push(makeMobPart(0.56,0.54,0.7,0xf6f0d2,0,0.78,0,root));
      parts.push(makeMobPart(0.38,0.4,0.38,0xf6f0d2,0,1.05,0.35,root));
      parts.push(makeMobPart(0.16,0.14,0.18,0xe2a034,0,1.0,0.63,root));
      parts.push(makeMobPart(0.12,0.16,0.04,0xc93d2f,0,1.18,0.56,root));
      parts.push(makeMobPart(0.2,0.08,0.42,0xffffff,0.28,0.82,0.02,root));
      parts.push(makeMobPart(0.2,0.08,0.42,0xffffff,-0.28,0.82,0.02,root));
      parts.push(makeMobPart(0.06,0.44,0.06,0xd39d42,-0.12,0.28,0.1,root));
      parts.push(makeMobPart(0.06,0.44,0.06,0xd39d42,0.12,0.28,0.1,root));
    }else{
      parts.push(makeMobPart(0.72,1.1,0.42,0xffffff,0,0.95,0,root,TEX.zombieShirt));
      parts.push(makeMobPart(0.58,0.58,0.58,0xffffff,0,1.78,0,root,TEX.zombieSkin));
      parts.push(makeMobPart(0.18,0.78,0.18,0xffffff,-0.18,0.39,0,root,TEX.zombiePants));
      parts.push(makeMobPart(0.18,0.78,0.18,0xffffff,0.18,0.39,0,root,TEX.zombiePants));
      parts.push(makeMobPart(0.16,0.86,0.16,0xffffff,-0.46,1.0,0,root,TEX.zombieShirt));
      parts.push(makeMobPart(0.16,0.86,0.16,0xffffff,0.46,1.0,0,root,TEX.zombieShirt));
    }
    root.userData.modelParts=parts;
    return root;
  }
  function updateSheepAppearance(m){
    if(!m||m.userData.type!=='sheep')return;
    const woolPart=m.userData.modelParts?.[0];
    if(!woolPart?.material)return;
    const color=m.userData.sheared?0xd8d2cb:getSheepWoolColor(m.userData.variant||0);
    woolPart.material.color.setHex(color);
    woolPart.scale.setScalar(m.userData.sheared?0.82:1);
  }
  function getMobLegParts(m){
    const parts=m.userData.modelParts||[];
    if(m.userData.type==='pig')return parts.slice(3,7);
    if(m.userData.type==='cow')return parts.slice(6,10);
    if(m.userData.type==='sheep')return parts.slice(2,6);
    if(m.userData.type==='chicken')return parts.slice(6,8);
    if(m.userData.type==='zombie')return parts.slice(2,4);
    return [];
  }
  function getMobArmParts(m){
    if(m.userData.type==='zombie')return (m.userData.modelParts||[]).slice(4,6);
    return [];
  }
  function updateMobAnimation(m,dt){
    const moveSpeed=Math.hypot(m.userData.vx||0,m.userData.vz||0)+(m.userData.fleeT>0?0.2:0);
    m.userData.animT=(m.userData.animT||0)+dt*Math.max(1.2,moveSpeed*4.5);
    m.userData.lookT=(m.userData.lookT||0)-dt;
    if(m.userData.lookT<=0){
      m.userData.lookT=0.8+Math.random()*2.2;
      m.userData.lookYawTarget=(Math.random()-0.5)*(m.userData.type==='zombie'?0.55:0.8);
    }
    m.userData.lookYaw=(m.userData.lookYaw||0)+((m.userData.lookYawTarget||0)-(m.userData.lookYaw||0))*Math.min(1,dt*2.6);
    const head=m.userData.modelParts?.[1];
    if(head&&m.userData.grazeT<=0)head.rotation.y=m.userData.lookYaw||0;
    const swing=Math.sin(m.userData.animT||0)*Math.min(0.7,moveSpeed*0.7);
    const legs=getMobLegParts(m);
    legs.forEach((leg,idx)=>{
      if(!leg)return;
      leg.rotation.x=(idx%2===0?1:-1)*swing;
    });
    const arms=getMobArmParts(m);
    arms.forEach((arm,idx)=>{
      if(!arm)return;
      arm.rotation.x=(idx%2===0?-1:1)*swing*0.8;
    });
    if(m.userData.type==='chicken'){
      const wings=(m.userData.modelParts||[]).slice(4,6);
      wings.forEach((wing,idx)=>{
        if(!wing)return;
        wing.rotation.z=(idx===0?1:-1)*(0.15+Math.abs(swing)*0.8+(m.userData.hurtT>0?0.25:0));
      });
    }
  }
  function mobDrops(m,burning=false){
    const type=typeof m==='string'?m:m?.userData?.type;
    if(type==='zombie')return [{id:IT.ROTTEN_FLESH,min:1,max:2,ch:0.9}];
    if(type==='pig')return [{id:burning?IT.PORKCHOP_COOKED:IT.PORKCHOP_RAW,min:1,max:3,ch:1}];
    if(type==='cow')return [{id:burning?IT.BEEF_COOKED:IT.BEEF_RAW,min:1,max:3,ch:1}];
    if(type==='sheep'){
      const drops=[{id:burning?IT.LAMB_COOKED:IT.LAMB_RAW,min:1,max:3,ch:1}];
      if(typeof m!=='string'&&!m.userData?.sheared)drops.unshift({id:WOOL_BASE_ID+(m.userData.variant||0),min:1,max:1,ch:1});
      return drops;
    }
    if(type==='chicken')return [{id:burning?IT.CHICKEN_COOKED:IT.CHICKEN_RAW,min:1,max:3,ch:1},{id:IT.ARROW,min:0,max:1,ch:0.2}];
    return [];
  }
  function killMob(m,burning=false){
    if(!m)return;
    const dropsTable=mobDrops(m,burning);
    for(const d of dropsTable){
      if(Math.random()>d.ch)continue;
      const count=d.min+((Math.random()*((d.max-d.min)+1))|0);
      if(count>0)spawnDropStack(m.position.x,m.position.y,m.position.z,d.id,count,0.35);
    }
    const idx=mobs.indexOf(m);
    if(idx>=0)mobs.splice(idx,1);
    scene.remove(m);disposeObject3D(m);
    requestWorldSave(250);
  }
  function spawnMob(type,wx,wy,wz,variantOverride=null){
    const def=MOB_DEF[type];if(!def)return null;
    const variant=variantOverride??(type==='sheep'?pickSheepVariant():0);
    const mesh=createMobModel(type,variant);
    const modelParts=mesh.userData.modelParts||[];
    mesh.position.set(wx+0.5,wy,wz+0.5);
    mesh.userData={type,variant,hp:def.hp,vx:0,vz:0,dirT:0,hurtT:0,burnT:0,fleeT:0,jumpVy:0,sheared:false,grazeT:0,animT:Math.random()*Math.PI*2,lookT:0,lookYaw:0,lookYawTarget:0,targetYaw:0,modelParts,hitbox:{...(def.hitbox||{x:0.8,y:1,z:0.8}),offsetY:0}};
    updateSheepAppearance(mesh);
    scene.add(mesh);mobs.push(mesh);return mesh;
  }
  function tryUseShearsOnMob(){
    const held=INV.hotbar[INV.active];
    if(!held||held.id!==IT.SHEARS)return false;
    const mob=getTargetMob(4.2);
    if(!mob||mob.userData.type!=='sheep'||mob.userData.sheared)return false;
    mob.userData.sheared=true;
    mob.userData.grazeT=0;
    updateSheepAppearance(mob);
    const count=2+((Math.random()*3)|0);
    spawnDropStack(mob.position.x,mob.position.y,mob.position.z,WOOL_BASE_ID+(mob.userData.variant||0),count,0.15);
    consumeHeldToolDurability(1);
    spawnColorParticles(mob.position.x,mob.position.y+0.9,mob.position.z,getSheepWoolColor(mob.userData.variant||0),10,0.45);
    requestWorldSave(180);
    updateHotbarUI();drawHand();
    return true;
  }
  function updateMobs(dt){
    if(isPaused)return;
    const night=dayTime>=0.53&&dayTime<=0.95;
    if(mobs.length<32&&Math.random()<dt*(night?1.65:1.15)){
      const angle=Math.random()*Math.PI*2;
      const radius=28+Math.random()*34;
      const mx=Math.floor(player.pos.x+Math.cos(angle)*radius);
      const mz=Math.floor(player.pos.z+Math.sin(angle)*radius);
      const y=getSurfaceY(mx,mz);
      if(y>0&&worldGet(mx,y+1,mz)===B.AIR&&worldGet(mx,y,mz)!==B.WATER&&Math.hypot(mx-player.pos.x,mz-player.pos.z)>24){
        const lowLight=night||y<CFG.seaLevel-2;
        if(lowLight&&night&&Math.random()<0.52)spawnMob('zombie',mx,y+1,mz);
        else if(!night){
          const t=['pig','cow','chicken','sheep'][Math.floor(Math.random()*4)];
          if(!mobs.some(m=>Math.hypot(m.position.x-(mx+0.5),m.position.z-(mz+0.5))<8))spawnMob(t,mx,y+1,mz);
        }
      }
    }
    for(let i=mobs.length-1;i>=0;i--){
      const m=mobs[i],def=MOB_DEF[m.userData.type];
      m.userData.hurtT=Math.max(0,(m.userData.hurtT||0)-dt);
      const mobParts=m.userData.modelParts||[];
      if(m.userData.hurtT>0){
        m.rotation.z=Math.sin((m.userData.hurtT*40))*0.08;
        mobParts.forEach(part=>part.material?.emissive?.setHex?.(0x441111));
        m.userData.fleeT=2.6;
      }else{
        m.rotation.z*=0.75;
        mobParts.forEach(part=>part.material?.emissive?.setHex?.(0x000000));
      }
      m.userData.fleeT=Math.max(0,(m.userData.fleeT||0)-dt);
      m.userData.dirT-=dt;
      if(m.userData.dirT<=0){
        m.userData.dirT=1+Math.random()*2.5;
        let ang=Math.random()*Math.PI*2;
        if(def.hostile&&m.position.distanceTo(player.pos)<10)ang=Math.atan2(player.pos.x-m.position.x,player.pos.z-m.position.z);
        else if(m.userData.fleeT>0)ang=Math.atan2(m.position.x-player.pos.x,m.position.z-player.pos.z);
        m.userData.targetYaw=ang;
        m.userData.vx=Math.sin(ang)*def.speed;m.userData.vz=Math.cos(ang)*def.speed;
      }
      const head=m.userData.modelParts?.[1];
      if(m.userData.type==='sheep'){
        if(m.userData.sheared&&m.userData.grazeT<=0&&worldGet(Math.floor(m.position.x),Math.floor(m.position.y-1),Math.floor(m.position.z))===B.GRASS&&Math.random()<dt*0.18){
          m.userData.grazeT=1.6;
        }
        if(m.userData.grazeT>0){
          m.userData.grazeT=Math.max(0,m.userData.grazeT-dt);
          if(head)head.rotation.x=Math.min(0.9,(1.6-m.userData.grazeT)*1.6);
          if(m.userData.grazeT===0){
            const gx=Math.floor(m.position.x),gy=Math.floor(m.position.y-1),gz=Math.floor(m.position.z);
            if(worldGet(gx,gy,gz)===B.GRASS){
              worldSet(gx,gy,gz,B.DIRT);
              spawnParticles(gx,gy,gz,B.GRASS);
              buildChunkMesh(Math.floor(gx/16),Math.floor(gz/16));
            }
            m.userData.sheared=false;
            updateSheepAppearance(m);
          }
        }else if(head)head.rotation.x*=0.75;
      }
      const speedMul=m.userData.fleeT>0?1.8:1;
      const step=dt*0.35*speedMul;
      const nextX=m.position.x+m.userData.vx*step;
      const nextZ=m.position.z+m.userData.vz*step;
      const nextWX=Math.floor(nextX),nextWZ=Math.floor(nextZ);
      const aheadY=getSurfaceY(nextWX,nextWZ);
      const nextFoot=worldGet(nextWX,Math.max(1,Math.floor(m.position.y-0.2)),nextWZ);
      const waterAhead=nextFoot===B.WATER||worldGet(nextWX,Math.max(1,Math.floor(m.position.y+0.6)),nextWZ)===B.WATER;
      if(aheadY>0&&aheadY-m.position.y>0.45&&m.userData.jumpVy<=0)m.userData.jumpVy=4.6;
      const grav=waterAhead?4.2:12;
      m.userData.jumpVy=Math.max(waterAhead?-2.5:-8,(m.userData.jumpVy||0)-grav*dt);
      m.position.x=nextX;m.position.z=nextZ;
      m.position.y+=m.userData.jumpVy*dt;
      const sy=getSurfaceY(Math.floor(m.position.x),Math.floor(m.position.z));
      const fluidHere=worldGet(Math.floor(m.position.x),Math.max(1,Math.floor(m.position.y)),Math.floor(m.position.z));
      if(fluidHere===B.WATER||fluidHere===B.LAVA){
        const fluidLift=fluidHere===B.WATER?0.7:0.5;
        const fluidRise=fluidHere===B.WATER?2.4:1.35;
        const fluidFloor=fluidHere===B.WATER?0.35:0.12;
        const targetY=Math.max(sy+fluidLift,m.position.y);
        m.position.y+=Math.min((targetY-m.position.y),dt*fluidRise);
        m.userData.jumpVy=Math.max(m.userData.jumpVy,fluidFloor);
        if(fluidHere===B.WATER&&Math.random()<0.14*dt*60)spawnColorParticles(m.position.x,m.position.y+0.35,m.position.z,0x66bbff,1,0.12);
        if(fluidHere===B.LAVA&&Math.random()<0.18*dt*60)spawnColorParticles(m.position.x,m.position.y+0.4,m.position.z,0xff7b22,2,0.14);
      }else if(sy>0&&m.position.y<=sy+1){m.position.y=sy+1;m.userData.jumpVy=0;}
      const desiredYaw=Math.atan2(m.userData.vx||0,m.userData.vz||0);
      if(Number.isFinite(desiredYaw))m.userData.targetYaw=desiredYaw;
      m.rotation.y+=angleDelta(m.userData.targetYaw||m.rotation.y,m.rotation.y)*Math.min(1,dt*5);
      updateMobAnimation(m,dt);
      const feet=worldGet(Math.floor(m.position.x),Math.floor(m.position.y-0.6),Math.floor(m.position.z));
      const clearSky=worldGet(Math.floor(m.position.x),Math.floor(m.position.y+2.2),Math.floor(m.position.z))===B.AIR;
      const daylight=dayTime>=0.06&&dayTime<=0.47;
      if(m.userData.type==='zombie'&&daylight&&WEATHER.state!=='thunder'&&clearSky){
        m.userData.burnT=Math.max(1.6,m.userData.burnT||0);
        m.userData.hp-=dt*5.5;
        if(Math.random()<0.2)spawnColorParticles(m.position.x,m.position.y+1.1,m.position.z,0xffa54b,2,0.18);
      }
      if(feet===B.FIRE||feet===B.LAVA){m.userData.burnT=2.5;m.userData.hp-=dt*(feet===B.LAVA?12:6);}
      if(fluidHere===B.WATER&&(m.userData.burnT||0)>0)m.userData.burnT=Math.max(0,(m.userData.burnT||0)-dt*4);
      else m.userData.burnT=Math.max(0,(m.userData.burnT||0)-dt);
      if(def.hostile&&m.position.distanceTo(player.pos)<1.4)applyDamage(6*dt,false);
      if(m.userData.hp<=0){killMob(m,(m.userData.burnT||0)>0);continue;}
      if(m.position.distanceTo(player.pos)>96){scene.remove(m);disposeObject3D(m);mobs.splice(i,1);}
    }
  }
  camera.position.copy(player.pos);
  function notifyAutoPause(){
    if(hiddenPauseNotified||document.visibilityState!=='hidden')return;
    hiddenPauseNotified=true;
    try{
      if('Notification' in window){
        if(Notification.permission==='granted'){
          new Notification('Cubenix paused automatically',{body:'Game input was paused while the tab was inactive.',tag:'cubenix-auto-pause'});
        }else if(Notification.permission==='default'){
          Notification.requestPermission().then(permission=>{
            if(permission==='granted')new Notification('Cubenix paused automatically',{body:'Game input was paused while the tab was inactive.',tag:'cubenix-auto-pause'});
          }).catch(()=>{});
        }
      }
    }catch{}
  }
  function forcePauseGameplayState(){
    stopBreaking();
    bowChargeActive=false;
    bowChargeTime=0;
    eating.active=false;
    eatAction.active=false;
    resetGameplayInputs(true);
  }
  function canCapturePointer(){
    return document.getElementById('game-ui').style.display==='block'&&!isPaused&&!isInvOpen&&!isChatOpen&&!sleeping.active&&document.getElementById('settings-menu').style.display!=='flex';
  }
  function autoPauseGame(reason='hidden'){
    if(document.getElementById('game-ui').style.display!=='block')return;
    if(document.pointerLockElement)document.exitPointerLock();
    isPaused=true;
    document.getElementById('pause-menu').style.display='flex';
    document.getElementById('settings-menu').style.display='none';
    forcePauseGameplayState();
    applyHudVisibility();
    if(reason==='hidden')notifyAutoPause();
  }
   
   // Pointer lock
   canvas.addEventListener('click',()=>{if(!document.pointerLockElement&&canCapturePointer())canvas.requestPointerLock();});
  document.addEventListener('pointerlockchange',()=>{
     const locked=!!document.pointerLockElement;
     if(!locked)bowChargeActive=false;
     document.getElementById('crosshair').style.display=(locked&&showHud)?'block':'none';
     const inGame=document.getElementById('game-ui').style.display==='block';
     if(!locked&&inGame&&!isInvOpen&&!isPaused&&!isChatOpen&&document.getElementById('settings-menu').style.display!=='flex'){
       autoPauseGame(document.visibilityState==='hidden'?'hidden':'pointerlock');
     }
   });
   document.addEventListener('visibilitychange',()=>{
     if(document.visibilityState==='visible')hiddenPauseNotified=false;
     if(document.visibilityState==='hidden'&&document.getElementById('game-ui').style.display==='block'&&!isInvOpen&&!isChatOpen)autoPauseGame('hidden');
   });
   document.addEventListener('mousemove',e=>{
     if((e.buttons&1)!==0)POINTER_STATE.primary=true;
     else if((e.buttons&1)===0)POINTER_STATE.primary=false;
     if((e.buttons&2)!==0)POINTER_STATE.secondary=true;
     else if((e.buttons&2)===0)POINTER_STATE.secondary=false;
     if(!document.pointerLockElement||isPaused||isInvOpen||isChatOpen)return;
     player.yaw  -=e.movementX*CFG.mouseSens;
     player.pitch-=e.movementY*CFG.mouseSens;
     player.pitch=Math.max(-player.pitchMax,Math.min(player.pitchMax,player.pitch));
   });
   
  const KEYS={};
  const PHYS_KEYS={};
  let wLastTap=0,sprintTap=false,showHud=true,showDebugOverlay=false,isChatOpen=false;
  function applyHudVisibility(){
    const show=!!showHud;
    document.getElementById('hud').style.display=show?'block':'none';
    document.getElementById('hotbar').style.display=show?'flex':'none';
    document.getElementById('status-left').style.display=show?'flex':'none';
    document.getElementById('status-right').style.display=show?'flex':'none';
    document.getElementById('hand-overlay').style.display=show?'block':'none';
    const pointerActive=!!document.pointerLockElement&&!isPaused&&!isInvOpen&&!isChatOpen;
    document.getElementById('crosshair').style.display=(show&&pointerActive)?'block':'none';
  }
  let bowChargeActive=false,bowChargeTime=0;
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
  function canUseBow(){
    const held=INV.hotbar[INV.active];
    if(!held||held.id!==IT.BOW)return false;
    return [...INV.hotbar,...INV.main].some(s=>s&&s.id===IT.ARROW&&s.count>0);
  }
  function beginBowCharge(){
    if(!canUseBow())return false;
    bowChargeActive=true;bowChargeTime=0;
    return true;
  }
  function consumeArrowFromInventory(){
    const pool=[...INV.hotbar,...INV.main];
    const arrow=pool.find(s=>s&&s.id===IT.ARROW&&s.count>0);
    if(!arrow)return false;
    arrow.count--;
    if(arrow.count<=0){
      const hb=INV.hotbar.indexOf(arrow);if(hb>=0)INV.hotbar[hb]=null;
      const mi=INV.main.indexOf(arrow);if(mi>=0)INV.main[mi]=null;
    }
    return true;
  }
  function releaseBowShot(){
    if(!bowChargeActive)return;
    bowChargeActive=false;
    if(!canUseBow()||!consumeArrowFromInventory())return;
    const charge=Math.max(0.2,Math.min(1,bowChargeTime/1.2));
    const dir=new THREE.Vector3(0,0,-1).applyEuler(camera.rotation).normalize();
    const speed=18+charge*26;
    const p=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.06,0.6),new THREE.MeshLambertMaterial({map:TEX.arrow,transparent:true,alphaTest:0.05}));
    p.position.copy(camera.position).addScaledVector(dir,0.8);
    p.rotation.copy(camera.rotation);
    p.userData={arrow:true,owner:'player',vel:dir.multiplyScalar(speed),life:300,age:0,dmg:4+charge*6,stuck:false,collectDelay:0.15};
    scene.add(p);projectiles.push(p);
    consumeHeldToolDurability(1);
    updateHotbarUI();drawHand();
  }
  function addItemToInventoryOrDrop(id,count=1){
    let remaining=count;
    const slots=[INV.hotbar,INV.main];
    for(const list of slots){
      for(const stack of list){
        if(!stack||stack.id!==id)continue;
        const max=getMaxStackForId(id);
        const room=max-stack.count;
        if(room<=0)continue;
        const add=Math.min(room,remaining);
        stack.count+=add;
        remaining-=add;
        if(remaining<=0){updateHotbarUI();drawHand();return true;}
      }
      for(let i=0;i<list.length&&remaining>0;i++){
        if(list[i])continue;
        const add=Math.min(getMaxStackForId(id),remaining);
        list[i]=makeItemStack(id,add);
        remaining-=add;
      }
      if(remaining<=0){updateHotbarUI();drawHand();return true;}
    }
    if(remaining>0)spawnDropStack(player.pos.x,player.pos.y+0.2,player.pos.z,id,remaining,0);
    updateHotbarUI();drawHand();
    return remaining<=0;
  }

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
  function resetGameplayInputs(resetTouchToggles=true){
    for(const key of Object.keys(PHYS_KEYS))PHYS_KEYS[key]=false;
    for(const key of Object.keys(KEYS))KEYS[key]=false;
    for(const sources of TOUCH.keySources.values())sources.clear();
    TOUCH.lookTouchId=null;
    TOUCH.lastLookX=0;
    TOUCH.lastLookY=0;
    if(resetTouchToggles){
      TOUCH.forceSprint=false;
      TOUCH.forceSneak=false;
      document.getElementById('touch-sprint')?.classList.remove('active');
      document.getElementById('touch-sneak')?.classList.remove('active');
    }
    CONTROLLER.prevButtons.length=0;
    POINTER_STATE.primary=false;
    POINTER_STATE.secondary=false;
    sprintTap=false;
  }
  let chatHideTimer=null;
  let systemToastTimer=null;
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

  function showSystemToast(msg,ms=3200){
    const el=document.getElementById('system-toast');
    if(!el)return;
    el.textContent=String(msg||'').trim();
    if(!el.textContent)return;
    el.style.display='block';
    if(systemToastTimer)clearTimeout(systemToastTimer);
    systemToastTimer=setTimeout(()=>{el.style.display='none';systemToastTimer=null;},ms);
  }

  function showChatTransient(ms=5000){
    const panel=document.getElementById('chat-panel');
    const feed=document.getElementById('chat-feed');
    const last=CHAT.messages[CHAT.messages.length-1]||'';
    panel.style.display='none';
    feed.textContent=last;
    feed.style.display='block';
    const input=document.getElementById('chat-input');
    input.blur();
    if(chatHideTimer)clearTimeout(chatHideTimer);
    chatHideTimer=setTimeout(()=>{
      if(!isChatOpen)feed.style.display='none';
      chatHideTimer=null;
    },ms);
  }
  function trySendChatMessage(){
    const input=document.getElementById('chat-input');
    const text=input.value.trim();
    if(!text)return;
    pushChatMessage(`You: ${text}`);
    isChatOpen=false;
    input.value='';
    showChatTransient(5000);
    if(document.getElementById('game-ui').style.display==='block'&&!isPaused&&!isInvOpen&&document.getElementById('settings-menu').style.display!=='flex'){
      }
  }
  function closeChat(){
    isChatOpen=false;
    const panel=document.getElementById('chat-panel');
    panel.style.display='none';
    document.getElementById('chat-feed').style.display='none';
    if(chatHideTimer){clearTimeout(chatHideTimer);chatHideTimer=null;}
    const input=document.getElementById('chat-input');
    input.value='';
    input.blur();
    if(document.getElementById('game-ui').style.display==='block'&&!isPaused&&!isInvOpen&&document.getElementById('settings-menu').style.display!=='flex'){
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
    const ae=document.activeElement;
    const editing=!!ae&&(ae.tagName==='INPUT'||ae.tagName==='TEXTAREA'||ae.isContentEditable);
    if(editing&&e.ctrlKey&&e.code==='KeyA')return;
    if(keybindCaptureAction&&document.getElementById('settings-menu').style.display==='flex'){
      e.preventDefault();
      if(e.code!=='Escape')KEYBINDS[keybindCaptureAction]=e.code;
      keybindCaptureAction=null;
      saveSettingsLocal();
      buildSettingsTab('controls');
      return;
    }
    if(document.getElementById('worlds-screen').style.display==='flex'&&e.code==='Enter'){
      e.preventDefault();
      launchSelectedWorld(false);
      return;
    }
    if(e.code==='Escape'){
      if(isChatOpen){e.preventDefault();closeChat();return;}
      if(document.getElementById('quit-confirm').style.display==='flex'){e.preventDefault();document.getElementById('quit-confirm').style.display='none';return;}
      if(document.getElementById('world-delete-confirm').style.display==='flex'){e.preventDefault();closeDeleteWorldConfirm();return;}
      if(document.getElementById('world-create-screen').style.display==='flex'){e.preventDefault();openWorldList();return;}
      if(document.getElementById('worlds-screen').style.display==='flex'){e.preventDefault();closeWorldScreens();return;}
      if(isInvOpen){e.preventDefault();closeUiScreen();return;}
      if(document.getElementById('settings-menu').style.display==='flex'){e.preventDefault();closeSettingsMenu();return;}
      if(isPaused){e.preventDefault();togglePause();return;}
    }
    if(isChatOpen){
      return;
    }
    if(editing)return;
    const canonical=canonicalForEvent(e.code);
    if(canonical){
      PHYS_KEYS[canonical]=true;
      KEYS[canonical]=true;
    }
    if(e.altKey&&e.code==='Digit1'){
      e.preventDefault();
      showHud=!showHud;
      applyHudVisibility();
      return;
    }
    if(e.altKey&&e.code==='Digit2'){
      e.preventDefault();
      const a=document.createElement('a');
      a.href=canvas.toDataURL('image/png');
      a.download=`cubenix-${Date.now()}.png`;
      a.click();
      return;
    }
    if(e.altKey&&e.code==='Digit3'){
      e.preventDefault();
      showDebugOverlay=!showDebugOverlay;
      return;
    }
    PHYS_KEYS[e.code]=true;
    KEYS[e.code]=true;
    if(['Space','ArrowUp','ArrowDown'].includes(e.code))e.preventDefault();
    if(e.code.startsWith('Digit')){const n=parseInt(e.code.slice(5))-1;if(n>=0&&n<9){INV.active=n;updateHotbarUI();drawHand();}}
    if(matchesKeybind(e,'pause'))togglePause();
    if(matchesKeybind(e,'inventory'))toggleInventory();
    if(matchesKeybind(e,'chat')){e.preventDefault();openChat();return;}
    if(e.code==='KeyF'){e.preventDefault();if(ridingBoat)dismountBoat();else mountNearestBoat();return;}
    if(e.code==='KeyG'){e.preventDefault();if(!ridingBoat){const b=nearestBoat(3.4);if(b)destroyBoat(b);}return;}
    if(e.code==='KeyH'){showHud=!showHud;applyHudVisibility();}
    if(matchesKeybind(e,'forward')&&!e.repeat){
       const now=performance.now()*0.001;
       if(now-wLastTap<0.3)sprintTap=true;
       wLastTap=now;
     }
  });
  window.addEventListener('keyup',e=>{
    const canonical=canonicalForEvent(e.code);
    if(canonical){
      PHYS_KEYS[canonical]=false;
      const virtualCount=TOUCH.keySources.get(canonical)?.size||0;
      KEYS[canonical]=virtualCount>0;
    }
    PHYS_KEYS[e.code]=false;
    const virtualCount=TOUCH.keySources.get(e.code)?.size||0;
    KEYS[e.code]=virtualCount>0;
    if(matchesKeybind(e,'forward'))sprintTap=false;
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
    const show=('ontouchstart' in window)||(navigator.maxTouchPoints>0);
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
      if(!tryUseShearsOnMob()&&!tryOpenInteractable())placeBlock();
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
    if(placeBtn&&!CONTROLLER.prevButtons[7]){if(!tryUseShearsOnMob()&&!tryOpenInteractable())placeBlock();}
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
  let lastGroundedVy=0;

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

  function hasSneakSupportAt(x,z,y){
    const w=player.width/2-0.02;
    const fy=Math.floor(y-0.06);
    const pts=[[x-w,z-w],[x-w,z+w],[x+w,z-w],[x+w,z+w]];
    return pts.some(([px,pz])=>isSolid(worldGet(Math.floor(px),fy,Math.floor(pz))));
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

  function getBoatWaterSurfaceY(boat){
    const samples=[[0,0],[0.44,0],[-0.44,0],[0,0.7],[0,-0.7]];
    let found=false,highest=-1e9;
    for(const [ox,oz] of samples){
      const wx=Math.floor(boat.position.x+ox),wz=Math.floor(boat.position.z+oz);
      for(let y=Math.floor(boat.position.y+1);y>=Math.floor(boat.position.y-2);y--){
        if(worldGet(wx,y,wz)===B.WATER){highest=Math.max(highest,y+0.62);found=true;break;}
      }
    }
    return found?highest:null;
  }

  function pushBoatOutOfSolids(boat){
    const halfX=0.56,halfZ=0.96;
    for(let iy=Math.floor(boat.position.y-0.28);iy<=Math.floor(boat.position.y+0.2);iy++){
      for(let ix=Math.floor(boat.position.x-halfX);ix<=Math.floor(boat.position.x+halfX);ix++){
        for(let iz=Math.floor(boat.position.z-halfZ);iz<=Math.floor(boat.position.z+halfZ);iz++){
          if(!isSolid(worldGet(ix,iy,iz)))continue;
          boat.position.y=Math.max(boat.position.y,iy+1.22);
          boat.userData.vy=Math.max(0,boat.userData.vy||0);
          boat.userData.vx*=0.82;boat.userData.vz*=0.82;
        }
      }
    }
  }

  function movePlayer(dt){
     if(isPaused||isInvOpen||isChatOpen||sleeping.active)return;
     if(ridingBoat){
      if(isShiftDown()){dismountBoat();return;}
      const boat=ridingBoat;
      const onWater=getBoatWaterSurfaceY(boat)!==null;
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
      updateBoatPhysics(boat,dt,true);
      const fx=Math.floor(boat.position.x),fz=Math.floor(boat.position.z);
      const by=Math.floor(boat.position.y-0.5);
      if(!onWater&&isSolid(worldGet(fx,by,fz))){boat.userData.vx*=0.5;boat.userData.vz*=0.5;boat.userData.vy=Math.max(0,boat.userData.vy||0);}
      boat.rotation.y+= angleDelta(player.yaw,boat.rotation.y)*Math.min(1,dt*8);
      player.pos.set(boat.position.x,boat.position.y+0.42,boat.position.z);
      player.vel.set(0,0,0);
      unphasePlayerIfNeeded();
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
     const startX=player.pos.x,startZ=player.pos.z;
     const steps=3;
     const stepDt=dt/steps;
     for(let s=0;s<steps;s++)resolveCollision(player.pos,player.vel,stepDt);
    unphasePlayerIfNeeded();
    if(sneaking&&player.onGround&&playerBodyFluid()===B.AIR&&!hasSneakSupportAt(player.pos.x,player.pos.z,player.pos.y)){
      const xOk=hasSneakSupportAt(startX,player.pos.z,player.pos.y);
      const zOk=hasSneakSupportAt(player.pos.x,startZ,player.pos.y);
      if(xOk)player.pos.x=startX;
      if(zOk)player.pos.z=startZ;
      if(!xOk&&!zOk){player.pos.x=startX;player.pos.z=startZ;}
      player.vel.x=0;player.vel.z=0;
      if(player.vel.y<0)player.vel.y=0;
    }

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

    if(player.onGround){
      const impact=-Math.min(0,lastGroundedVy);
      const feetBlock=worldGet(Math.floor(player.pos.x),Math.floor(player.pos.y),Math.floor(player.pos.z));
      const headBlock=worldGet(Math.floor(player.pos.x),Math.floor(player.pos.y+player.eyeOffset),Math.floor(player.pos.z));
      if(impact>14&&bodyFluid!==B.WATER&&bodyFluid!==B.LAVA&&feetBlock!==B.WATER&&feetBlock!==B.LAVA&&headBlock!==B.WATER&&headBlock!==B.LAVA){
        const excess=impact-14;
        applyDamage(excess*2.1,true);
      }
      lastGroundedVy=0;
    }else if(player.vel.y<0){
      lastGroundedVy=player.vel.y;
    }

    camera.position.set(player.pos.x,player.pos.y+player.eyeOffset,player.pos.z);
     camera.rotation.order='YXZ';camera.rotation.y=player.yaw;camera.rotation.x=player.pitch;camera.rotation.z=0;
   }
   
  function updateSurvivalStats(dt){
    if(sleeping.active)return;
    if(player.pos.y<0){
      const voidDamageRate=STATS.maxHealth*0.20;
      applyDamage(voidDamageRate*dt,true);
    }
    const headY=Math.floor(player.pos.y+player.eyeOffset);
    const headBlock=worldGet(Math.floor(player.pos.x),headY,Math.floor(player.pos.z));
    const bodyFluid=worldGet(Math.floor(player.pos.x),Math.floor(player.pos.y+0.2),Math.floor(player.pos.z));
    if(headBlock===B.WATER){
      STATS.air=Math.max(0,STATS.air-7.5*dt);
      if(STATS.air<=0)applyDamage(12*dt,true);
    }else STATS.air=Math.min(STATS.maxAir,STATS.air+45*dt);
    if(bodyFluid===B.WATER){
      waterContactT+=dt;
      if(waterContactT>0.08){waterContactT=0;spawnContactParticle(0x66bbff,0.55);} 
    }else waterContactT=0;
    if(bodyFluid===B.LAVA){
      applyDamage(18*dt,false);
      lavaContactT+=dt;
      if(lavaContactT>0.11){lavaContactT=0;spawnContactParticle(0xff5500,0.45);spawnContactParticle(0xffaa33,0.4);} 
    }else lavaContactT=0;
    const feetBlock=worldGet(Math.floor(player.pos.x),Math.floor(player.pos.y),Math.floor(player.pos.z));
    if(feetBlock===B.FIRE)applyDamage(10*dt,true);
    if(hungerPauseT>0)hungerPauseT=Math.max(0,hungerPauseT-dt);
    const hungerDrain=(KEYS['KeyW']&&KEYS[KEYBINDS.forward]&&STATS.energy>0)?0.22:0.045;
    const hungerMul=hungerPauseT>0?0:1;
    STATS.hunger=Math.max(0,STATS.hunger-hungerDrain*dt*hungerMul);
    STATS.saturation=Math.max(0,STATS.saturation-((hungerDrain*0.55)*dt));
    if(STATS.hunger<=0)applyDamage(4*dt,true);
    if(STATS.hunger>STATS.maxHunger*0.6&&STATS.shield<STATS.maxShield){
      STATS.shield=Math.min(STATS.maxShield,STATS.shield+1.8*dt);
    }
    const fullFed=STATS.hunger>=STATS.maxHunger-0.25;
    if(fullFed&&STATS.saturation>0&&STATS.health<STATS.maxHealth){
      const fastRegen=2.8+STATS.saturation*0.22;
      STATS.health=Math.min(STATS.maxHealth,STATS.health+fastRegen*dt);
      STATS.saturation=Math.max(0,STATS.saturation-1.15*dt);
      healFlashT=Math.min(1.2,healFlashT+dt*0.8);
    }
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

  function dropUnsupportedTorch(wx,wy,wz){
    if(worldGet(wx,wy,wz)!==B.TORCH)return false;
    if(isSolid(worldGet(wx,wy-1,wz)))return false;
    worldSet(wx,wy,wz,B.AIR);
    spawnDrops(wx,wy,wz,B.TORCH,0.35);
    buildChunkMesh(Math.floor(wx/16),Math.floor(wz/16));
    return true;
  }
  function updateUnsupportedTorches(){
    const px=Math.floor(player.pos.x),py=Math.floor(player.pos.y),pz=Math.floor(player.pos.z);
    for(let dx=-10;dx<=10;dx++)for(let dz=-10;dz<=10;dz++)for(let dy=10;dy>=-8;dy--){
      dropUnsupportedTorch(px+dx,py+dy,pz+dz);
    }
  }

  function updateFireBlocks(){
    const px=Math.floor(player.pos.x),py=Math.floor(player.pos.y),pz=Math.floor(player.pos.z);
    for(let dx=-12;dx<=12;dx++)for(let dz=-12;dz<=12;dz++)for(let dy=8;dy>=-8;dy--){
      const wx=px+dx,wy=py+dy,wz=pz+dz;
      if(worldGet(wx,wy,wz)!==B.FIRE)continue;
      const nearWater=[[1,0,0],[-1,0,0],[0,0,1],[0,0,-1],[0,-1,0],[0,1,0]].some(([ax,ay,az])=>worldGet(wx+ax,wy+ay,wz+az)===B.WATER);
      if(nearWater){
        worldSet(wx,wy,wz,B.AIR);
        buildChunkMesh(Math.floor(wx/16),Math.floor(wz/16));
        continue;
      }
      const supported=isSolid(worldGet(wx,wy-1,wz));
      const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
      for(const [sx,sz] of dirs){
        const bid=worldGet(wx+sx,wy,wz+sz);
        if(bid===B.TNT&&Math.random()<0.08){igniteTnt(wx+sx,wy,wz+sz);continue;}
        if(isBurnableBlock(bid)&&Math.random()<0.015){
          worldSet(wx+sx,wy,wz+sz,B.FIRE);
          buildChunkMesh(Math.floor((wx+sx)/16),Math.floor((wz+sz)/16));
        }
      }
      if(!supported||Math.random()<0.009){
        worldSet(wx,wy,wz,B.AIR);
        buildChunkMesh(Math.floor(wx/16),Math.floor(wz/16));
      }
    }
    for(let dx=-10;dx<=10;dx++)for(let dz=-10;dz<=10;dz++)for(let dy=6;dy>=-6;dy--){
      const wx=px+dx,wy=py+dy,wz=pz+dz;
      if(worldGet(wx,wy,wz)!==B.LAVA)continue;
      const around=[[1,0],[-1,0],[0,1],[0,-1]];
      for(const [sx,sz] of around){
        const bid=worldGet(wx+sx,wy,wz+sz);
        if(bid===B.TNT&&Math.random()<0.05){igniteTnt(wx+sx,wy,wz+sz);continue;}
        if(isBurnableBlock(bid)&&Math.random()<0.008){
          worldSet(wx+sx,wy,wz+sz,B.FIRE);
          buildChunkMesh(Math.floor((wx+sx)/16),Math.floor((wz+sz)/16));
        }
      }
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
  let grassSpreadTimer=0;
  function isSkyVisible(wx,wy,wz){
    for(let y=wy+1;y<CFG.chunkH;y++){
      const id=worldGet(wx,y,wz);
      if(id!==B.AIR&&id!==B.LEAVES&&id!==B.WATER)return false;
    }
    return true;
  }
  function updateGrassGrowth(dt){
    grassSpreadTimer+=dt;
    if(grassSpreadTimer<0.65)return;
    grassSpreadTimer=0;
    const px=Math.floor(player.pos.x),pz=Math.floor(player.pos.z),py=Math.floor(player.pos.y);
    for(let i=0;i<70;i++){
      const wx=px+((Math.random()*30)|0)-15;
      const wz=pz+((Math.random()*30)|0)-15;
      const wy=Math.max(1,Math.min(CFG.chunkH-2,py+((Math.random()*18)|0)-9));
      if(worldGet(wx,wy,wz)!==B.DIRT)continue;
      if(worldGet(wx,wy+1,wz)!==B.AIR)continue;
      if(!isSkyVisible(wx,wy,wz))continue;
      if(Math.random()<0.28){
        worldSet(wx,wy,wz,B.GRASS);
        buildChunkMesh(Math.floor(wx/16),Math.floor(wz/16));
      }
    }
  }
  let farmlandTick=0;
  function isNearWater(wx,wy,wz,r=1){
    const checks=[[0,0],[1,0],[-1,0],[0,1],[0,-1]];
    for(const [dx,dz] of checks){
      if(worldGet(wx+dx,wy,wz+dz)===B.WATER||worldGet(wx+dx,wy+1,wz+dz)===B.WATER)return true;
    }
    return false;
  }
  function updateFarmland(dt){
    farmlandTick+=dt;
    if(farmlandTick<0.8)return;
    farmlandTick=0;
    const feetX=Math.floor(player.pos.x),feetY=Math.floor(player.pos.y-0.1),feetZ=Math.floor(player.pos.z);
    const feetId=worldGet(feetX,feetY,feetZ);
    if(player.onGround&&(feetId===B.FARMLAND_DRY||feetId===B.FARMLAND_WET)&&Math.random()<0.12){
      worldSet(feetX,feetY,feetZ,Math.random()<0.35?B.DIRT:B.FARMLAND_DRY);
      buildChunkMesh(Math.floor(feetX/16),Math.floor(feetZ/16));
    }
    const px=Math.floor(player.pos.x),py=Math.floor(player.pos.y),pz=Math.floor(player.pos.z);
    for(let i=0;i<120;i++){
      const wx=px+((Math.random()*36)|0)-18,wz=pz+((Math.random()*36)|0)-18,wy=Math.max(1,Math.min(CFG.chunkH-2,py+((Math.random()*20)|0)-10));
      const id=worldGet(wx,wy,wz);
      if(id!==B.FARMLAND_DRY&&id!==B.FARMLAND_WET)continue;
      const wet=isNearWater(wx,wy,wz,1);
      if(wet&&id===B.FARMLAND_DRY){worldSet(wx,wy,wz,B.FARMLAND_WET);buildChunkMesh(Math.floor(wx/16),Math.floor(wz/16));}
      else if(!wet&&id===B.FARMLAND_WET&&Math.random()<0.45){worldSet(wx,wy,wz,B.FARMLAND_DRY);buildChunkMesh(Math.floor(wx/16),Math.floor(wz/16));}
      else if(!wet&&id===B.FARMLAND_DRY&&Math.random()<0.13){worldSet(wx,wy,wz,B.DIRT);buildChunkMesh(Math.floor(wx/16),Math.floor(wz/16));}
    }
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
    if(id===B.TORCH){
      outlineMesh.scale.set(0.25,0.75,0.25);
      outlineMesh.position.set(wx+0.5,wy+0.375,wz+0.5);
      return;
    }
    const h=getBlockHeight(id);
    outlineMesh.scale.set(1,h,1);
    outlineMesh.position.set(wx+0.5,wy+h*0.5,wz+0.5);
  }

  function rayHitsBlockShape(id,wx,wy,wz,dir,dist){
    if(id===B.TORCH){
      const pt=new THREE.Vector3(camera.position.x,camera.position.y,camera.position.z).addScaledVector(dir,Math.max(0,dist));
      return pt.x>=wx+0.375&&pt.x<=wx+0.625&&pt.y>=wy&&pt.y<=wy+0.75&&pt.z>=wz+0.375&&pt.z<=wz+0.625;
    }
    const h=getBlockHeight(id);
    if(h>=0.999)return true;
    const pt=new THREE.Vector3(camera.position.x,camera.position.y,camera.position.z).addScaledVector(dir,Math.max(0,dist));
    return pt.y<=wy+h+0.001;
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
     let prevT=0;
     for(let i=0;i<Math.ceil(CFG.maxReach*3);i++){
       const b=worldGet(ix,iy,iz);
       if(b!==B.AIR&&!isFluid(b)&&rayHitsBlockShape(b,ix,iy,iz,dir,prevT)){
         targetBlock={wx:ix,wy:iy,wz:iz,face:face.slice()};
        applyOutlineForTarget(ix,iy,iz,b);outlineMesh.visible=true;
         document.getElementById('crosshair').classList.add('targeting');return;
       }
       if(tmx<tmy&&tmx<tmz){prevT=tmx;tmx+=tdx;ix+=sx;face=[-sx,0,0];}
       else if(tmy<tmz){prevT=tmy;tmy+=tdy;iy+=sy;face=[0,-sy,0];}
       else{prevT=tmz;tmz+=tdz;iz+=sz;face=[0,0,-sz];}
       if(Math.min(tmx,tmy,tmz)>CFG.maxReach)break;
     }
     targetBlock=null;outlineMesh.visible=false;outlineMesh.scale.set(1,1,1);
     document.getElementById('crosshair').classList.remove('targeting');
   }
   
  // ═══════════════════════════════════════════════════════════
  // 10. BLOCK BREAKING
  // ═══════════════════════════════════════════════════════════
   let breaking={active:false,wx:0,wy:0,wz:0,progress:0,total:0,fxTimer:0};
   const breakMat=new THREE.MeshBasicMaterial({color:0,transparent:true,opacity:0});
   const breakMesh=new THREE.Mesh(new THREE.BoxGeometry(1.012,1.012,1.012),breakMat);
   scene.add(breakMesh);
   
   function spawnBreakCrackPopup(wx,wy,wz,id){
    spawnParticles(wx,wy,wz,id);
    spawnColorParticles(wx+0.5,wy+0.55,wz+0.5,0xffffff,6,0.35);
   }
   function startBreaking(){
    if(!targetBlock)return;
    const id=worldGet(targetBlock.wx,targetBlock.wy,targetBlock.wz);
    const t=BREAK_TIME[id]??7.5;if(t===Infinity)return;
    const chestFp=getLargeChestFootprint(targetBlock.wx,targetBlock.wy,targetBlock.wz,id);
    if(t<=0){
      breaking={active:false,wx:targetBlock.wx,wy:targetBlock.wy,wz:targetBlock.wz,progress:0,total:0,chestFp,fxTimer:0};
      finishBreaking();
      return;
    }
    breaking={active:true,...targetBlock,progress:0,total:Math.max(0.01,t*getBreakMultiplier(id)),chestFp,fxTimer:0};
    spawnBreakCrackPopup(targetBlock.wx,targetBlock.wy,targetBlock.wz,id);
   }
   function stopBreaking(){breaking.active=false;breaking.progress=0;breaking.fxTimer=0;breakMat.opacity=0;breakMesh.scale.set(1,1,1);}
   
   // Particles
   const particles=[];
   const projectiles=[];
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
   function spawnColorParticles(x,y,z,color=0xffaa44,count=10,spread=0.5){
    for(let i=0;i<count;i++){
      const p=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.06,0.06),new THREE.MeshLambertMaterial({color}));
      p.position.set(x+(Math.random()-0.5)*spread,y+(Math.random()-0.5)*spread,z+(Math.random()-0.5)*spread);
      p.userData={vel:new THREE.Vector3((Math.random()-0.5)*4,Math.random()*3+0.3,(Math.random()-0.5)*4),life:0.45+Math.random()*0.35};
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
  function updateProjectiles(dt){
    for(let i=projectiles.length-1;i>=0;i--){
      const p=projectiles[i];
      p.userData.life-=dt;
      p.userData.age=(p.userData.age||0)+dt;
      if(p.userData.stuck){
        if(p.userData.collectDelay>0)p.userData.collectDelay-=dt;
        if(p.userData.arrow&&p.userData.owner==='player'&&p.userData.collectDelay<=0&&p.position.distanceTo(player.pos)<1.1){
          addItemToInventoryOrDrop(IT.ARROW,1);
          removeAndDisposeSceneObject(p);projectiles.splice(i,1);continue;
        }
        if(p.userData.life<=0){removeAndDisposeSceneObject(p);projectiles.splice(i,1);}
        continue;
      }
      const prevPos=p.position.clone();
      p.userData.vel.y-=9.8*dt*0.25;
      p.position.addScaledVector(p.userData.vel,dt);
      const ix=Math.floor(p.position.x),iy=Math.floor(p.position.y),iz=Math.floor(p.position.z);
      let hitMob=null;
      for(const m of mobs){
        const hb=getMobHitboxBounds(m);
        if(p.position.x>=hb.min.x&&p.position.x<=hb.max.x&&p.position.y>=hb.min.y&&p.position.y<=hb.max.y&&p.position.z>=hb.min.z&&p.position.z<=hb.max.z){
          hitMob=m;break;
        }
      }
      if(hitMob){
        hitMob.userData.hp-=(p.userData.dmg||6);
        hitMob.userData.hurtT=0.25;
        if(hitMob.userData.hp<=0)killMob(hitMob,(hitMob.userData.burnT||0)>0);
        removeAndDisposeSceneObject(p);projectiles.splice(i,1);continue;
      }
      if(p.userData.owner==='player'&&p.userData.age>0.18&&p.position.distanceTo(player.pos)<0.7){
        applyDamage(p.userData.dmg||6,false);
        removeAndDisposeSceneObject(p);projectiles.splice(i,1);continue;
      }
      if(isSolid(worldGet(ix,iy,iz))){
        p.position.copy(prevPos);
        p.userData.stuck=true;
        p.userData.vel.set(0,0,0);
        p.userData.life=Math.min(p.userData.life,300);
        continue;
      }
      if(p.userData.vel.lengthSq()>0.0001){
        const velDir=p.userData.vel.clone().normalize();
        p.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),velDir);
      }
      if(p.userData.life<=0){
        removeAndDisposeSceneObject(p);projectiles.splice(i,1);continue;
      }
    }
   }
   
  // Dropped items (land on ground)
  const drops=[];
  function spawnDropStack(wx,wy,wz,id,count=1,pickupDelay=0){
    const isBlock=id<100;
    const m=new THREE.Mesh(
      isBlock?new THREE.BoxGeometry(0.28,0.28,0.28):new THREE.PlaneGeometry(0.36,0.36),
      new THREE.MeshLambertMaterial({map:getItemTex(id),transparent:true,alphaTest:0.08,side:THREE.DoubleSide})
    );
    m.position.set(wx+0.5,wy+0.8,wz+0.5);
    m.userData={id,count,vy:1.5,onGround:false,life:300,bob:Math.random()*Math.PI*2,pickupDelay,isBlock};
    scene.add(m);drops.push(m);
    requestWorldSave(350);
  }
  function spawnDrops(wx,wy,wz,blockId,pickupDelay=0){
    const table=DROP_TABLE[blockId]??[{id:blockId,count:1,ch:1}];
    table.forEach(entry=>{
      if(Math.random()>entry.ch)return;
      spawnDropStack(wx,wy,wz,entry.id,entry.count,pickupDelay);
    });
  }
  function scatterContainerDrops(wx,wy,wz,key,pickupDelay=0.8){
    const slots=containerData.get(chestStorageKey(key))||containerData.get(key);
    if(!slots)return;
    for(const st of slots){
      if(!st)continue;
      let remain=st.count|0;
      while(remain>0){
        const take=Math.min(remain,getMaxStackForId(st.id));
        spawnDropStack(wx+(Math.random()-0.5)*0.45,wy,wz+(Math.random()-0.5)*0.45,st.id,take,pickupDelay);
        remain-=take;
      }
    }
    containerData.delete(chestStorageKey(key));
    containerData.delete(key);
  }
   function updateDrops(dt){
     for(let i=drops.length-1;i>=0;i--){
       const d=drops[i];
       if(!d.userData.onGround){
         d.userData.vy-=9.8*dt;
         d.position.y+=d.userData.vy*dt;
         const by=Math.floor(d.position.y-0.14);
         const below=worldGet(Math.floor(d.position.x),by,Math.floor(d.position.z));
         if(isSolid(below)||below===B.WATER||below===B.LAVA){
           d.position.y=by+1.14;d.userData.vy=0;d.userData.onGround=true;
         }
       }else{
         const by=Math.floor(d.position.y-0.16);
         const below=worldGet(Math.floor(d.position.x),by,Math.floor(d.position.z));
         if(!(isSolid(below)||below===B.WATER||below===B.LAVA))d.userData.onGround=false;
       }
      d.userData.bob+=dt*2;
      if(d.userData.onGround)d.position.y+=Math.sin(d.userData.bob)*0.004;
      d.rotation.y+=dt*2;
      if(!d.userData.isBlock){d.rotation.x=0;d.rotation.z=0;d.lookAt(camera.position);}
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
    spawnColorParticles(wx+0.5,wy+0.6,wz+0.5,0xffcc66,12,0.45);
  }

  function explodeTnt(wx,wy,wz){
    const power=4;
    const r=power*1.15;
    for(let x=Math.floor(wx-r);x<=Math.ceil(wx+r);x++)for(let y=Math.floor(wy-r);y<=Math.ceil(wy+r);y++)for(let z=Math.floor(wz-r);z<=Math.ceil(wz+r);z++){
      const dx=x+0.5-wx,dy=y+0.5-wy,dz=z+0.5-wz;
      const d=Math.sqrt(dx*dx+dy*dy+dz*dz);
      if(d>r)continue;
      const id=worldGet(x,y,z);
      if(id===B.AIR||id===B.BEDROCK)continue;
      if(id===B.TNT){igniteTnt(x,y,z);continue;}
      const intensity=Math.max(0,power-(d*0.95));
      const resist=BLAST_RESISTANCE[id]??2;
      if(intensity<=resist)continue;
      if(CHEST_UI[id]){
        const ck=worldPosKey(x,y,z);
        scatterContainerDrops(x,y,z,ck,0.9);
        clearPair(ck);
      }
      if(Math.random()<0.92)spawnDrops(x,y,z,id,0.8);
      worldSet(x,y,z,B.AIR);
      spawnParticles(x,y,z,id);
      buildChunkMesh(Math.floor(x/16),Math.floor(z/16));
    }
    for(let i=drops.length-1;i>=0;i--){
      if(drops[i].position.distanceTo(new THREE.Vector3(wx,wy,wz))<r){
        const d=drops[i];
        const dir=d.position.clone().sub(new THREE.Vector3(wx,wy,wz));
        const len=Math.max(0.001,dir.length());
        dir.multiplyScalar(1/len);
        d.position.addScaledVector(dir,(r-len)*0.35);
      }
    }
    for(const t of primedTnts){
      const dir=t.mesh.position.clone().sub(new THREE.Vector3(wx,wy,wz));
      const dist=dir.length();
      if(dist>8||dist<=0.001)continue;
      dir.multiplyScalar(1/dist);
      t.mesh.position.addScaledVector(dir,(8-dist)*0.18);
      t.vy+=Math.max(0.8,(8-dist)*0.5);
    }
    for(const b of boats){
      const dir=b.position.clone().sub(new THREE.Vector3(wx,wy,wz));
      const dist=dir.length();
      if(dist>8||dist<=0.001)continue;
      dir.multiplyScalar(1/dist);
      b.userData.vx=(b.userData.vx||0)+dir.x*(8-dist)*0.9;
      b.userData.vz=(b.userData.vz||0)+dir.z*(8-dist)*0.9;
      b.userData.vy=(b.userData.vy||0)+Math.max(0.5,(8-dist)*0.35);
    }
    const pd=player.pos.distanceTo(new THREE.Vector3(wx,wy,wz));
    if(pd<7){
      const pdir=player.pos.clone().sub(new THREE.Vector3(wx,wy,wz));
      const plen=Math.max(0.001,pdir.length());
      pdir.multiplyScalar(1/plen);
      player.vel.x+=pdir.x*Math.max(0,(7-pd))*1.8;
      player.vel.z+=pdir.z*Math.max(0,(7-pd))*1.8;
      player.vel.y=Math.max(player.vel.y,pdir.y*Math.max(1.2,(7-pd))*0.8+Math.max(0.8,(7-pd))*0.45);
    }
    if(pd<2.3)applyDamage(STATS.maxHealth+STATS.maxShield,true);
    else if(pd<6)applyDamage((6-pd)*12,false);
    for(const m of mobs){
      const md=m.position.distanceTo(new THREE.Vector3(wx,wy,wz));
      if(md>7)continue;
      const mdir=m.position.clone().sub(new THREE.Vector3(wx,wy,wz));
      const mlen=Math.max(0.001,mdir.length());
      mdir.multiplyScalar(1/mlen);
      m.userData.vx=(m.userData.vx||0)+mdir.x*Math.max(0,(7-md))*2.1;
      m.userData.vz=(m.userData.vz||0)+mdir.z*Math.max(0,(7-md))*2.1;
      m.userData.jumpVy=Math.max(m.userData.jumpVy||0,Math.max(1,(7-md))*0.8);
      m.userData.hurtT=Math.max(m.userData.hurtT||0,0.2);
      m.userData.hp-=Math.max(0,(6-md))*2.2;
    }
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
        spawnColorParticles(p.x,p.y,p.z,0xff8833,28,0.9);
        scene.remove(t.mesh);t.mesh.geometry.dispose();t.mesh.material.dispose();
        primedTnts.splice(i,1);
        explodeTnt(p.x,p.y,p.z);
      }
      if(Math.random()<0.45)spawnColorParticles(t.mesh.position.x,t.mesh.position.y+0.5,t.mesh.position.z,0xffcc66,2,0.25);
    }
  }
   
   canvas.addEventListener('mousedown',e=>{
     if(!document.pointerLockElement||isPaused||isInvOpen)return;
     if(e.button===0)POINTER_STATE.primary=true;
     if(e.button===2)POINTER_STATE.secondary=true;
     if(e.button===0){if(!tryHitBoat()&&!tryHitMob())startBreaking();}
     if(e.button===2){
      if(beginBowCharge())return;
      if(!tryUseShearsOnMob()&&!tryUseBoat()&&!tryOpenInteractable())placeBlock();
     }
   });
   canvas.addEventListener('mouseup',e=>{
    if(e.button===0)POINTER_STATE.primary=false;
    if(e.button===2)POINTER_STATE.secondary=false;
    if(e.button===0)stopBreaking();
    if(e.button===2&&bowChargeActive)releaseBowShot();
   });
   window.addEventListener('blur',()=>{POINTER_STATE.primary=false;POINTER_STATE.secondary=false;forcePauseGameplayState();if(document.getElementById('game-ui').style.display==='block'&&!isInvOpen&&!isChatOpen)autoPauseGame('hidden');});
   
 
  function finishBreaking(){
    const id=worldGet(breaking.wx,breaking.wy,breaking.wz);
    if(id===B.AIR||id===B.BEDROCK){stopBreaking();return;}
    if(id===B.BED){breakBedPair(breaking.wx,breaking.wy,breaking.wz,true);stopBreaking();return;}
    if(id===B.DEV_CHEST){stopBreaking();return;}
    const targets=[{wx:breaking.wx,wy:breaking.wy,wz:breaking.wz}];
    let chestKey=null;
    if(CHEST_UI[id]){
      chestKey=worldPosKey(breaking.wx,breaking.wy,breaking.wz);
      const pair=getLargeChestFootprint(breaking.wx,breaking.wy,breaking.wz,id);
      if(pair)targets.push({wx:pair.other.wx,wy:pair.other.wy,wz:pair.other.wz});
      scatterContainerDrops(breaking.wx,breaking.wy,breaking.wz,chestKey,0.8);
      clearPair(chestKey);
    }
    const chunkKeys=new Set();
    for(const t of targets){
      spawnParticles(t.wx,t.wy,t.wz,id);
      spawnDrops(t.wx,t.wy,t.wz,id,0.8);
      worldSet(t.wx,t.wy,t.wz,B.AIR);
      clearChestMeta(worldPosKey(t.wx,t.wy,t.wz));
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
    breaking.fxTimer=(breaking.fxTimer||0)+dt;
    const pct=breaking.progress/breaking.total;
    breakMat.opacity=Math.min(0.7,pct*0.7);
    const fp=breaking.chestFp&&worldGet(breaking.wx,breaking.wy,breaking.wz)===worldGet(breaking.chestFp.other.wx,breaking.chestFp.other.wy,breaking.chestFp.other.wz)?breaking.chestFp:null;
    if(fp){
      breakMesh.scale.set(fp.maxX-fp.minX+1,1,fp.maxZ-fp.minZ+1);
      breakMesh.position.set((fp.minX+fp.maxX+1)/2,breaking.wy+0.5,(fp.minZ+fp.maxZ+1)/2);
    }else if(worldGet(breaking.wx,breaking.wy,breaking.wz)===B.TORCH){
      breakMesh.scale.set(0.25,0.75,0.25);
      breakMesh.position.set(breaking.wx+0.5,breaking.wy+0.375,breaking.wz+0.5);
    }else{
      breakMesh.scale.set(1,1,1);
      breakMesh.position.set(breaking.wx+0.5,breaking.wy+0.5,breaking.wz+0.5);
    }
    if(breaking.fxTimer>=0.18){
      breaking.fxTimer=0;
      const id=worldGet(breaking.wx,breaking.wy,breaking.wz);
      if(id!==B.AIR)spawnBreakCrackPopup(breaking.wx,breaking.wy,breaking.wz,id);
    }
    if(pct>=1)finishBreaking();
  }
  function consumeFoodNow(slotIndex,foodId){
    const held=INV.hotbar[slotIndex];
    if(!held||held.id!==foodId)return false;
    const f=FOOD_STATS[foodId];
    if(!f)return false;
    const hungerMissing=Math.max(0,STATS.maxHunger-STATS.hunger);
    const almostFull=STATS.hunger>=STATS.maxHunger-2;
    const canHealWithFood=!f.bad&&(almostFull||hungerMissing<=f.nutrition*0.35)&&STATS.health<STATS.maxHealth;
    if(hungerMissing<=0&&STATS.health>=STATS.maxHealth&&!f.bad&&STATS.shield>=STATS.maxShield)return false;
    if(hungerMissing>0)STATS.hunger=Math.min(STATS.maxHunger,STATS.hunger+Math.min(hungerMissing,f.nutrition*0.5));
    if(!f.bad)STATS.saturation=Math.min(STATS.maxSaturation,STATS.saturation+f.sat);
    if(canHealWithFood){
      const healAmt=Math.max(0.35,f.sat*0.4+(f.nutrition*0.08));
      STATS.health=Math.min(STATS.maxHealth,STATS.health+healAmt);
      healFlashT=Math.min(1.2,healFlashT+0.2+healAmt*0.03);
    }
    if(!f.bad&&almostFull){
      STATS.shield=Math.min(STATS.maxShield,STATS.shield+Math.max(0.2,f.sat*0.08));
    }
    if(!f.bad)hungerPauseT=Math.max(hungerPauseT,getFoodHungerPause(foodId));
    if(f.bad&&Math.random()<0.35)applyDamage(4,false);
    held.count--;
    if(held.count<=0)INV.hotbar[slotIndex]=null;
    requestWorldSave(200);
    updateHotbarUI();drawHand();
    return true;
  }
  function startEatingHeldFood(){
    const held=INV.hotbar[INV.active];
    if(!held||!FOOD_STATS[held.id])return false;
    if(eatAction.active&&eatAction.slot===INV.active&&eatAction.itemId===held.id)return true;
    eatAction={active:true,slot:INV.active,itemId:held.id,time:0,total:getFoodEatDuration(held.id)};
    return true;
  }
  function updateEating(dt){
    if(!eatAction.active)return;
    const held=INV.hotbar[eatAction.slot];
    if(!held||held.id!==eatAction.itemId){eatAction.active=false;return;}
    eatAction.time+=dt;
    if(eatAction.time>=eatAction.total){
      consumeFoodNow(eatAction.slot,eatAction.itemId);
      eatAction.active=false;
    }
  }
   
   // Block placement (RMB)
  function placeBlock(){
     const held=INV.hotbar[INV.active];
     if(!held)return;
     if(FOOD_STATS[held.id])return startEatingHeldFood();
     if(!targetBlock)return;
     if(held.id===IT.BOW)return;
     const convertHeldBucket=(toId)=>{
      if(held.count>1){
        held.count--;
        addItemToInventoryOrDrop(toId,1);
      }else{
        held.id=toId;
        ensureStackIntegrity(held);
      }
      updateHotbarUI();drawHand();
     };
     if(held.id===IT.BUCKET||held.id===IT.WATER_BUCKET||held.id===IT.LAVA_BUCKET){
      const tid=worldGet(targetBlock.wx,targetBlock.wy,targetBlock.wz);
      const pickupFluid=(wx,wy,wz,fluidId)=>{
        if(fluidId!==B.WATER&&fluidId!==B.LAVA)return false;
        if(worldGet(wx,wy,wz)!==fluidId)return false;
        worldSet(wx,wy,wz,B.AIR);
        convertHeldBucket(fluidId===B.WATER?IT.WATER_BUCKET:IT.LAVA_BUCKET);
        buildChunkMesh(Math.floor(wx/16),Math.floor(wz/16));
        requestWorldSave(120);
        return true;
      };
      if(held.id===IT.BUCKET&&(tid===B.WATER||tid===B.LAVA)){
        if(pickupFluid(targetBlock.wx,targetBlock.wy,targetBlock.wz,tid))return;
      }else if(held.id===IT.BUCKET&&targetBlock.face[1]!==0){
        const aboveId=worldGet(targetBlock.wx,targetBlock.wy+targetBlock.face[1],targetBlock.wz);
        if((aboveId===B.WATER||aboveId===B.LAVA)&&pickupFluid(targetBlock.wx,targetBlock.wy+targetBlock.face[1],targetBlock.wz,aboveId))return;
      }
      if(held.id===IT.WATER_BUCKET||held.id===IT.LAVA_BUCKET){
        const [fx,fy,fz]=targetBlock.face;
        const px=targetBlock.wx+fx,py=targetBlock.wy+fy,pz=targetBlock.wz+fz;
        if(worldGet(px,py,pz)===B.AIR||isFluid(worldGet(px,py,pz))){
          worldSet(px,py,pz,held.id===IT.WATER_BUCKET?B.WATER:B.LAVA);
          convertHeldBucket(IT.BUCKET);
          buildChunkMesh(Math.floor(px/16),Math.floor(pz/16));
          requestWorldSave(120);
        }
      }
      return;
     }
     if(TOOL_STATS[held.id]?.type==='shovel'||TOOL_STATS[held.id]?.type==='hoe'){
      const tid=worldGet(targetBlock.wx,targetBlock.wy,targetBlock.wz);
      const above=worldGet(targetBlock.wx,targetBlock.wy+1,targetBlock.wz);
      if(above===B.AIR&&(TOOL_STATS[held.id].type==='shovel'&&(tid===B.GRASS||tid===B.DIRT))){
        worldSet(targetBlock.wx,targetBlock.wy,targetBlock.wz,B.GRASS_PATH);
        consumeHeldToolDurability(1);buildChunkMesh(Math.floor(targetBlock.wx/16),Math.floor(targetBlock.wz/16));updateHotbarUI();drawHand();
        return;
      }
      if(above===B.AIR&&(TOOL_STATS[held.id].type==='hoe'&&(tid===B.GRASS||tid===B.DIRT||tid===B.GRASS_PATH))){
        worldSet(targetBlock.wx,targetBlock.wy,targetBlock.wz,B.FARMLAND_DRY);
        consumeHeldToolDurability(1);buildChunkMesh(Math.floor(targetBlock.wx/16),Math.floor(targetBlock.wz/16));updateHotbarUI();drawHand();
        return;
      }
     }
     if(held.id===IT.FLINT_STEEL){
      let used=false;
      const targetId=worldGet(targetBlock.wx,targetBlock.wy,targetBlock.wz);
      if(targetId===B.TNT){
        igniteTnt(targetBlock.wx,targetBlock.wy,targetBlock.wz);
        used=true;
      }else{
        const [fx,fy,fz]=targetBlock.face;
        const px=targetBlock.wx+fx,py=targetBlock.wy+fy,pz=targetBlock.wz+fz;
        if(worldGet(px,py,pz)===B.AIR&&isSolid(worldGet(px,py-1,pz))){
          worldSet(px,py,pz,B.FIRE);
          buildChunkMesh(Math.floor(px/16),Math.floor(pz/16));
          used=true;
        }
      }
      if(used||targetBlock){
        consumeHeldToolDurability(1);
        updateHotbarUI();drawHand();
      }
      return;
     }
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
     if(held.id===IT.BED){
       const [fx,fy,fz]=targetBlock.face;
       const px=targetBlock.wx+fx,py=targetBlock.wy+fy,pz=targetBlock.wz+fz;
       const dir=bedDirFromYaw(player.yaw);
       const [dx,dz]=bedForward(dir);
       const hx=px+dx,hz=pz+dz;
       if(worldGet(px,py,pz)!==B.AIR||worldGet(hx,py,hz)!==B.AIR)return;
       if(!isSolid(worldGet(px,py-1,pz))||!isSolid(worldGet(hx,py-1,hz)))return;
       worldSet(px,py,pz,B.BED);worldSet(hx,py,hz,B.BED);
       const footKey=worldPosKey(px,py,pz),headKey=worldPosKey(hx,py,hz);
       setBedMeta(footKey,{part:'foot',dir,otherKey:headKey});
       setBedMeta(headKey,{part:'head',dir,otherKey:footKey});
       held.count--;if(held.count<=0)INV.hotbar[INV.active]=null;
       buildChunkMesh(Math.floor(px/16),Math.floor(pz/16));buildChunkMesh(Math.floor(hx/16),Math.floor(hz/16));updateHotbarUI();drawHand();requestWorldSave(180);
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
     if(CHEST_UI[held.id]){
     const key=worldPosKey(px,py,pz);
      const placedSneak=isShiftPlacement();
      const forceSingle=!!CHEST_UI[held.id]?.noPair;
      setChestMeta(key,{
        placedSneak,
        noPair:placedSneak||forceSingle,
        nbt:{placedBy:'player',placedSneak,ver:'0.0.89_patch6'},
      });
      if(placedSneak||forceSingle){
        const near=chestNeighbors(px,py,pz,held.id).find(k=>{const pos=parseWorldPosKey(k);return pos&&worldGet(pos.wx,pos.wy,pos.wz)===held.id;});
        if(near){setChestMeta(near,{noPair:true});clearPair(key);clearPair(near);}
      }else tryPairChest(px,py,pz,held.id);
     }
     held.count--;if(held.count<=0)INV.hotbar[INV.active]=null;
     updateHotbarUI();drawHand();
     buildChunkMesh(Math.floor(px/16),Math.floor(pz/16));
   }
   
   // ═══════════════════════════════════════════════════════════
   // 11. ANIMATED TEXTURES (water / lava)
   // ═══════════════════════════════════════════════════════════
   let waterAnim=0,lavaAnim=0,lastWaterFrame=-1,lastLavaFrame=-1;
   function updateAnimTex(dt){
     waterAnim=(waterAnim+dt*3.6)%TEX.waterFrames.length;
     lavaAnim=(lavaAnim+dt*4.0)%TEX.lavaFrames.length;
     const wf=Math.floor(waterAnim),lf=Math.floor(lavaAnim);
     if(wf!==lastWaterFrame){
      lastWaterFrame=wf;
      const wm=getMats(B.WATER);
      wm.forEach(m=>{m.map=TEX.waterFrames[wf];m.needsUpdate=true;});
     }
     if(lf!==lastLavaFrame){
      lastLavaFrame=lf;
      const lm=getMats(B.LAVA);
      lm.forEach(m=>{m.map=TEX.lavaFrames[lf];m.needsUpdate=true;});
     }
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
     {w:3,h:2,pat:[WOOL_BASE_ID,WOOL_BASE_ID,WOOL_BASE_ID,IT.STICK,IT.STICK,IT.STICK],out:{id:IT.BED,count:1}},
     {w:2,h:1,pat:[IT.FLINT,IT.IRON_INGOT],out:{id:IT.FLINT_STEEL,count:1}},
     {w:1,h:2,pat:[IT.IRON_INGOT,0],out:{id:IT.BUCKET,count:1}},
     {w:3,h:1,pat:[IT.STICK,IT.STICK,IT.STICK],out:{id:IT.ARROW,count:6}},
     {w:3,h:1,pat:[B.PLANKS,B.PLANKS,B.PLANKS],out:{id:B.OAK_SLAB,count:6}},
     {w:3,h:1,pat:[B.STONE,B.STONE,B.STONE],out:{id:B.STONE_SLAB,count:6}},
     {w:3,h:1,pat:[B.COBBLESTONE,B.COBBLESTONE,B.COBBLESTONE],out:{id:B.COBBLE_SLAB,count:6}},
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
     {w:1,h:3,pat:[B.PLANKS,IT.STICK,IT.STICK],out:{id:IT.WOOD_SHOVEL,count:1}},
     {w:1,h:3,pat:[B.COBBLESTONE,IT.STICK,IT.STICK],out:{id:IT.STONE_SHOVEL,count:1}},
     {w:1,h:3,pat:[IT.IRON_INGOT,IT.STICK,IT.STICK],out:{id:IT.IRON_SHOVEL,count:1}},
     {w:1,h:3,pat:[IT.GOLD_INGOT,IT.STICK,IT.STICK],out:{id:IT.GOLD_SHOVEL,count:1}},
     {w:1,h:3,pat:[IT.DIAMOND,IT.STICK,IT.STICK],out:{id:IT.DIAMOND_SHOVEL,count:1}},
     {w:2,h:2,pat:[B.PLANKS,B.PLANKS,0,IT.STICK],out:{id:IT.WOOD_HOE,count:1}},
     {w:2,h:2,pat:[B.COBBLESTONE,B.COBBLESTONE,0,IT.STICK],out:{id:IT.STONE_HOE,count:1}},
     {w:2,h:2,pat:[IT.IRON_INGOT,IT.IRON_INGOT,0,IT.STICK],out:{id:IT.IRON_HOE,count:1}},
     {w:2,h:2,pat:[IT.GOLD_INGOT,IT.GOLD_INGOT,0,IT.STICK],out:{id:IT.GOLD_HOE,count:1}},
     {w:2,h:2,pat:[IT.DIAMOND,IT.DIAMOND,0,IT.STICK],out:{id:IT.DIAMOND_HOE,count:1}},
     {w:2,h:2,pat:[IT.IRON_INGOT,0,0,IT.IRON_INGOT],out:{id:IT.SHEARS,count:1}},
     {w:3,h:3,pat:[0,IT.STICK,B.PLANKS,IT.STICK,0,B.PLANKS,0,IT.STICK,B.PLANKS],out:{id:IT.BOW,count:1}},
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
  function shouldUseFlatIcon(id){return id>=100||id===B.TORCH||id===B.WATER||id===B.LAVA||id===B.FIRE;}
  function drawFlatIcon(g,w,h,id){
    const tex=getItemTex(id);
    if(!tex?.image)return;
    const s=Math.floor(w*0.78),o=((w-s)/2)|0;
    g.drawImage(tex.image,o,o,s,s);
  }
  function draw3DIcon(canvasEl, id){
     const g=canvasEl.getContext('2d');
     const w=canvasEl.width,h=canvasEl.height;
     g.imageSmoothingEnabled=false;
     g.clearRect(0,0,w,h);
     if(!id)return;
    if(shouldUseFlatIcon(id)){drawFlatIcon(g,w,h,id);return;}
    const bt=id<100?(BLOCK_TEX[id]||BLOCK_TEX[B.STONE]):null;
    const topTex=bt?bt.top:getItemTex(id);
    const sideTex=bt?bt.side:getItemTex(id);
    if(!topTex?.image||!sideTex?.image)return;
     // Draw full, centered isometric block icon
    const S=Math.floor(w*0.56);
    const ox=Math.floor((w-S*2)/2);
    const oy=Math.floor(h*0.1);
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
  function appendNutritionMeter(parent,item){
    const food=item?FOOD_STATS[item.id]:null;
    if(!food)return;
    const wrap=document.createElement('div');wrap.className='nutrition-slot-meter';
    const fill=document.createElement('div');fill.className='nutrition-slot-fill';
    fill.style.height=Math.max(10,Math.min(100,(food.nutrition/10)*100)).toFixed(1)+'%';
    if(food.bad)fill.style.background='linear-gradient(180deg,#89946c,#7b713c 55%,#544d32)';
    wrap.title=`Nutrition ${food.nutrition}/10`;
    wrap.appendChild(fill);
    parent.appendChild(wrap);
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
        appendNutritionMeter(slot,item);
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
    [B.DEV_CHEST]:{name:'Developer Chest',single:135,cols:9,noPair:true},
  };
  const chestPairs=new Map();
  const chestMeta=new Map();
  const bedMeta=new Map();

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
  function chestMetaGet(key){return chestMeta.get(key)||null;}
  function setChestMeta(key,patch){const prev=chestMetaGet(key)||{};chestMeta.set(key,{...prev,...patch});}
  function clearChestMeta(key){chestMeta.delete(key);}
  function isChestNoPair(key){return !!chestMetaGet(key)?.noPair;}
  function bedMetaGet(key){return bedMeta.get(key)||null;}
  function setBedMeta(key,patch){const prev=bedMetaGet(key)||{};bedMeta.set(key,{...prev,...patch});}
  function clearBedMeta(key){bedMeta.delete(key);}
  function wasChestPlacedSneak(key){return !!chestMetaGet(key)?.placedSneak;}
  function isShiftPlacement(){
    return !!(isShiftDown()||TOUCH.forceSneak);
  }
  function sanitizeChestPairFor(key,blockId){
    const otherKey=getPairKey(key);
    if(!otherKey)return;
    const a=parseWorldPosKey(key),b=parseWorldPosKey(otherKey);
    if(!a||!b){clearPair(key);return;}
    if(worldGet(a.wx,a.wy,a.wz)!==blockId||worldGet(b.wx,b.wy,b.wz)!==blockId){clearPair(key);}
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
    if(CHEST_UI[blockId]?.noPair)return;
    if(isChestNoPair(key)||wasChestPlacedSneak(key))return;
    clearPair(key);
    const candidates=chestNeighbors(wx,wy,wz,blockId).filter(k=>!getPairKey(k)&&!isChestNoPair(k)&&!wasChestPlacedSneak(k));
    if(candidates.length===1){
      setPair(key,candidates[0]);
      setChestMeta(key,{noPair:false,placedSneak:false});setChestMeta(candidates[0],{noPair:false,placedSneak:false});
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
  function moveStackBetweenLists(stack,targetLists){
    if(!stack)return null;
    let moving=normalizeStack({...stack});
    for(const list of targetLists){
      for(const slot of list){
        if(!slot||slot.id!==moving.id)continue;
        const room=getMaxStackForId(slot.id)-slot.count;
        if(room<=0)continue;
        const take=Math.min(room,moving.count);
        slot.count+=take;
        moving.count-=take;
        if(moving.count<=0)return null;
      }
    }
    for(const list of targetLists){
      for(let i=0;i<list.length&&moving.count>0;i++){
        if(list[i])continue;
        const take=Math.min(getMaxStackForId(moving.id),moving.count);
        list[i]=makeItemStack(moving.id,take);
        moving.count-=take;
      }
      if(moving.count<=0)return null;
    }
    return moving;
  }
  function quickMoveStack(arr,idx,source){
    const stack=arr?.[idx];
    if(!stack)return false;
    const targetLists=source==='container'?[INV.main,INV.hotbar]:source==='hotbar'?(openContainerSlots?[openContainerSlots,INV.main]:[INV.main]):source==='main'?(openContainerSlots?[openContainerSlots,INV.hotbar]:[INV.hotbar]):[];
    if(!targetLists.length)return false;
    const leftover=moveStackBetweenLists(stack,targetLists);
    arr[idx]=leftover;
    buildInventoryUI();updateHotbarUI();updateCraftResult();
    return true;
  }
  function collectMatchingInSection(source,idx){
    const arr=getSourceArray(source);
    const target=arr?.[idx];
    if(!target)return false;
    const sectionSources=source==='container'?['container']:(source==='craft'?['craft']:[source,'main','hotbar'].filter((v,i,a)=>a.indexOf(v)===i&&v!=='container'&&v!=='craft'));
    for(const sec of sectionSources){
      const list=getSourceArray(sec);
      if(!list)continue;
      for(let i=0;i<list.length;i++){
        if(sec===source&&i===idx)continue;
        const other=list[i];
        if(!other||other.id!==target.id)continue;
        const room=getMaxStackForId(target.id)-target.count;
        if(room<=0)break;
        const take=Math.min(room,other.count);
        target.count+=take;
        other.count-=take;
        if(other.count<=0)list[i]=null;
      }
    }
    buildInventoryUI();updateHotbarUI();updateCraftResult();
    return true;
  }
   
   function makeInvSlot(item,idx,source){
     const s=document.createElement('div');s.className='inv-slot';
     s.dataset.idx=idx;s.dataset.source=source;
   if(item){
      item=normalizeStack(item);
      s.appendChild(makeSlotCanvas(item.id,40));
      appendDurabilityBar(s,item);
      appendNutritionMeter(s,item);
       if(item.count>1){const c=document.createElement('span');c.className='item-count';c.textContent=item.count;s.appendChild(c);}
    }
    s.addEventListener('mouseenter',e=>{if(item)showTooltip(e,getItemName(item.id),getItemDescription(item.id,item));});
     s.addEventListener('mouseleave',()=>hideTooltip());
     s.addEventListener('mousedown',e=>{
      const arr=getSourceArray(source);
      if(e.button===0){
        if(e.shiftKey&&quickMoveStack(arr,idx,source)){e.preventDefault();e.stopPropagation();return;}
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
     s.addEventListener('dblclick',e=>{
      if(e.button!==0)return;
      collectMatchingInSection(source,idx);
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
     sanitizeChestPairFor(openContainerKey,blockId);
     openContainerStorageKey=chestStorageKey(openContainerKey);
     openContainerSlots=ensureContainer(openContainerStorageKey,chestCapacity(blockId,openContainerKey));
     if(blockId===B.DEV_CHEST){
      const allIds=getAllKnownIds();
      for(let i=0;i<openContainerSlots.length;i++){
        if(i<allIds.length){
          const id=allIds[i];
          openContainerSlots[i]=makeItemStack(id,getMaxStackForId(id));
        }else openContainerSlots[i]=null;
      }
     }
     setCraftingSize(2,false);
   }
   
   function renderCraftOutput(){
     const out=document.getElementById('craft-output');
     out.innerHTML='';
     if(INV.craftResult){
       out.appendChild(makeSlotCanvas(INV.craftResult.id,40));
       appendNutritionMeter(out,INV.craftResult);
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
         appendNutritionMeter(el,INV.craftGrid[i]);
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
  }

  function toggleInventory(){
    if(isInvOpen){closeUiScreen();return;}
    openInventoryMode();
    openUiScreen();
  }

  function bedDirFromYaw(yaw){
    const q=((Math.round(yaw/(Math.PI/2))%4)+4)%4;
    return [0,1,2,3][q];
  }
  function bedForward(dir){
    return dir===0?[0,1]:dir===1?[1,0]:dir===2?[0,-1]:[-1,0];
  }
  function getBedFootKeyFromAny(wx,wy,wz){
    const key=worldPosKey(wx,wy,wz);
    const meta=bedMetaGet(key);
    if(!meta)return key;
    return meta.part==='head'?(meta.otherKey||key):key;
  }
  function breakBedPair(wx,wy,wz,drop=true){
    const footKey=getBedFootKeyFromAny(wx,wy,wz);
    const foot=parseWorldPosKey(footKey);
    if(!foot)return false;
    const footMeta=bedMetaGet(footKey)||{};
    const headKey=footMeta.otherKey||footKey;
    const head=parseWorldPosKey(headKey);
    const cells=[foot,head].filter((c,i,a)=>c&&a.findIndex(v=>v&&v.wx===c.wx&&v.wy===c.wy&&v.wz===c.wz)===i);
    let dropped=false;
    for(const c of cells){
      if(worldGet(c.wx,c.wy,c.wz)===B.BED){
        worldSet(c.wx,c.wy,c.wz,B.AIR);
        buildChunkMesh(Math.floor(c.wx/16),Math.floor(c.wz/16));
        if(drop&&!dropped){spawnDropStack(c.wx+0.5,c.wy+0.4,c.wz+0.5,IT.BED,1,0.25);dropped=true;}
      }
      clearBedMeta(worldPosKey(c.wx,c.wy,c.wz));
    }
    return true;
  }
  function beginSleepAtBed(wx,wy,wz){
    const canSleep=(dayTime>=0.53&&dayTime<=0.95)||WEATHER.state==='thunder';
    if(!canSleep){showSystemToast('You can only sleep during nighttime or during thunderstorms.');return false;}
    const footKey=getBedFootKeyFromAny(wx,wy,wz);
    const foot=parseWorldPosKey(footKey); if(!foot)return false;
    const meta=bedMetaGet(footKey)||{};
    sleeping={active:true,timer:0,duration:1.35,wx:foot.wx,wy:foot.wy,wz:foot.wz,dir:meta.dir||0,otherKey:meta.otherKey||null};
    isPaused=false;
    return true;
  }
  function finishSleep(){
    dayTime=0.24;
    if(WEATHER.state==='rain'||WEATHER.state==='thunder'){WEATHER.state='clear';WEATHER.next=600+Math.random()*1200;WEATHER.timer=0;WEATHER.blend=0;}
    STATS.energy=STATS.maxEnergy;
    STATS.saturation=Math.min(STATS.maxSaturation,STATS.saturation+2.5);
    healFlashT=Math.min(1.2,healFlashT+0.45);
    sleeping.active=false;
    player.pitch=0;
    requestWorldSave(180);
  }
  function updateSleepAnimation(dt){
    if(!sleeping.active)return;
    sleeping.timer=Math.min(sleeping.duration,sleeping.timer+dt);
    const t=Math.min(1,sleeping.timer/Math.max(0.001,sleeping.duration));
    const eased=t<1?1-Math.pow(1-t,3):1;
    const [fx,fz]=bedForward(sleeping.dir);
    const cx=sleeping.wx+0.5+fx*0.18;
    const cz=sleeping.wz+0.5+fz*0.18;
    camera.position.set(cx,sleeping.wy+0.88-(eased*0.42),cz);
    camera.rotation.order='YXZ';
    camera.rotation.y=Math.atan2(-fx,-fz);
    camera.rotation.x=-0.6*eased;
    camera.rotation.z=0;
    if(sleeping.timer>=sleeping.duration)finishSleep();
  }

  function tryOpenInteractable(){
    if(!targetBlock)return false;
    const id=worldGet(targetBlock.wx,targetBlock.wy,targetBlock.wz);
    if(id===B.CRAFTING_TABLE){openCraftingTableMode();openUiScreen();return true;}
    if(CHEST_UI[id]){openChestMode(targetBlock.wx,targetBlock.wy,targetBlock.wz,id);openUiScreen();return true;}
    if(id===B.BED){return beginSleepAtBed(targetBlock.wx,targetBlock.wy,targetBlock.wz);}
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
     if(sleeping.active){const g=hc.getContext('2d');g.clearRect(0,0,160,220);return;}
     const g=hc.getContext('2d');
     g.clearRect(0,0,160,220);
     const moving=KEYS['KeyW']||KEYS['KeyA']||KEYS['KeyS']||KEYS['KeyD'];
     const sway=moving?Math.sin(handPhase)*6:0;
     const bob=moving?Math.cos(handPhase*2)*4:0;
     const eatingSwing=eatAction.active?Math.sin((eatAction.time/eatAction.total)*Math.PI*6)*10:0;
     const eatingLift=eatAction.active?Math.abs(Math.sin((eatAction.time/eatAction.total)*Math.PI*3))*18:0;
     // Arm base
     const armX=68+sway+eatingSwing*0.3,armY=88+bob-eatingLift*0.3;
     g.fillStyle='#cf8448';g.fillRect(armX,armY,56,132);
     g.fillStyle='#d99256';g.fillRect(armX+7,armY+8,41,108);
     g.fillStyle='#f0b177';g.fillRect(armX+14,armY+16,20,88);
     // Arm shading
     g.fillStyle='rgba(0,0,0,0.18)';g.fillRect(armX,armY,10,132);
     g.fillStyle='rgba(255,255,255,0.08)';g.fillRect(armX+46,armY+8,4,96);
     const held=INV.hotbar[INV.active];
     if(held){
       g.save();
       g.translate(75+sway+eatingSwing,100+bob-eatingLift);
       g.rotate(-0.55+Math.sin(handPhase*0.8)*0.04+(eatAction.active?0.35:0));
       const bt=held.id<100?(BLOCK_TEX[held.id]||BLOCK_TEX[B.STONE]):null;
       const top=bt?bt.top:getItemTex(held.id);
       const side=bt?bt.side:getItemTex(held.id);
       if(top?.image&&side?.image){
         g.imageSmoothingEnabled=false;
         const S=58;
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
     if(!isPaused){
       autoPauseGame('manual');
       return;
     }
     isPaused=false;
     document.getElementById('pause-menu').style.display='none';
  }
  function returnToMainMenu(){
    saveGameLocal();
    stopWorldStateSaveSync();
    isPaused=false;
    document.getElementById('pause-menu').style.display='none';
    document.getElementById('inventory-screen').style.display='none';
    document.getElementById('settings-menu').style.display='none';
    document.getElementById('game-ui').style.display='none';
    document.getElementById('game-canvas').style.display='none';
    document.getElementById('main-menu').style.display='flex';
    closeWorldScreens();
    if(document.pointerLockElement)document.exitPointerLock();
  }
  document.getElementById('pause-resume').addEventListener('click',()=>{isPaused=false;document.getElementById('pause-menu').style.display='none';resetGameplayInputs(false);applyHudVisibility();});
  document.getElementById('pause-settings').addEventListener('click',openSettings);
  document.getElementById('pause-saveMenu').addEventListener('click',returnToMainMenu);
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
     {key:'brightness',label:'Brightness',type:'range',min:0.2,max:1.0,step:0.1,unit:''},
     {key:'fogDensity',label:'Fog Density',type:'range',min:0.1,max:1.0,step:0.05,unit:''},
     {key:'guiScale',  label:'GUI Scale',type:'range',min:1,max:4,step:1,unit:''},
     {key:'leavesQuality',label:'Leaves Quality',type:'select',opts:['default','low','medium','high','ultra']},
     {key:'shadowsMode', label:'Shadows',type:'select',opts:['default','none','low','medium','high','ultra']},
     {key:'particlesMode',label:'Particles',type:'select',opts:['default','low','medium','high','ultra']},
     {key:'cloudsMode',label:'Clouds',type:'select',opts:['default','none','low','medium','high','ultra']},
     {key:'enableVSync',label:'Enable V-Sync',type:'toggle'},
     {key:'showSunMoon',label:'Show Sun / Moon',type:'toggle'},
     {key:'enableWeather',label:'Enable Weather',type:'toggle'},
     {key:'_optimize', label:'Auto-Optimize for Device',type:'action',action:optimizeSettings},
   ];
  const PLAYER_SETTINGS=[
     {key:'mouseSens', label:'Mouse Sensitivity',type:'range',min:0.0005,max:0.008,step:0.0005,unit:''},
     {key:'touchLookSens',label:'Touch Look Sensitivity',type:'range',min:0.4,max:2.5,step:0.1,unit:'x'},
     {key:'autoJump',label:'Auto Jump',type:'toggle'},
   ];
  const CONTROL_SETTINGS=KEYBIND_DEFS;
  const EXPERIMENTAL_SETTINGS=[
    {key:'enableNixPlus',label:'Enable Nix+ (Enhanced Graphics)',type:'toggle'},
    {key:'nixSaturation',label:'Nix+ Saturation',type:'range',min:0.8,max:1.8,step:0.05,unit:'x'},
    {key:'nixContrast',label:'Nix+ Contrast',type:'range',min:0.8,max:1.6,step:0.05,unit:'x'},
    {key:'nixGlow',label:'Nix+ Glow',type:'range',min:0,max:1,step:0.05,unit:''},
  ];

   const SETTINGS_KEYS=['renderDist','simDist','fov','brightness','fogDensity','guiScale','leavesQuality','shadowsMode','particlesMode','cloudsMode','mouseSens','touchLookSens','autoJump','enableVSync','showSunMoon','enableWeather','enableNixPlus','enableCubenixMobile','enableCubenixConnect','nixSaturation','nixContrast','nixGlow'];
  let keybindCaptureAction=null;
  let settingsContext='pause'; // pause | menu

   function saveSettingsLocal(){
     try{
       const data={};
       SETTINGS_KEYS.forEach(k=>{data[k]=CFG[k];});
       data.keybinds={...KEYBINDS};
       localStorage.setItem(SETTINGS_KEY,JSON.stringify(data));
     }catch{}
   }
  function loadSettingsLocal(){
     try{
       const raw=localStorage.getItem(SETTINGS_KEY);
       if(!raw)return;
       const data=JSON.parse(raw);
      SETTINGS_KEYS.forEach(k=>{if(data[k]!==undefined)CFG[k]=data[k];});
      Object.assign(KEYBINDS,normalizeKeybinds(data.keybinds));
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
  function serializeChunks(){
    return [...chunkData.entries()].map(([k,v])=>[k,Array.from(v)]);
   }
   function deserializeChunks(entries){
    chunkData.clear();
   for(const [k,arr] of (entries||[])){
      if(!Array.isArray(arr)||arr.length!==(16*16*256))continue;
      chunkData.set(k,new Uint8Array(arr));
   }
  }
  function encodeSavePayload(obj){
    try{return btoa(unescape(encodeURIComponent(JSON.stringify(obj))));}catch{return '';}
  }
  function decodeSavePayload(txt){
    try{return JSON.parse(decodeURIComponent(escape(atob(txt||''))));}catch{return null;}
  }
  const LOCAL_SAVE_DB_NAME='cubenixLocalSaveDb';
  const LOCAL_SAVE_DB_VERSION=1;
  const LOCAL_SAVE_STORE='worldStates';
  const SAVE_SYNC_INTERVAL_MS=50;
  let localSaveDbPromise=null;
  let pendingSaveState=null;
  let pendingSaveFlush=null;
  let saveSyncTimer=null;
  let worldMutationSuspended=false;
  let saveDebounceHandle=null;
  function openLocalSaveDb(){
    if(typeof indexedDB==='undefined')return Promise.resolve(null);
    if(localSaveDbPromise)return localSaveDbPromise;
    localSaveDbPromise=new Promise(resolve=>{
      try{
        const req=indexedDB.open(LOCAL_SAVE_DB_NAME,LOCAL_SAVE_DB_VERSION);
        req.onupgradeneeded=()=>{
          const db=req.result;
          if(!db.objectStoreNames.contains(LOCAL_SAVE_STORE))db.createObjectStore(LOCAL_SAVE_STORE,{keyPath:'worldId'});
        };
        req.onsuccess=()=>resolve(req.result||null);
        req.onerror=()=>resolve(null);
      }catch{
        resolve(null);
      }
    });
    return localSaveDbPromise;
  }
  async function writeWorldStateDb(worldId,data){
    const db=await openLocalSaveDb();
    if(!db||!worldId||!data)return false;
    return new Promise(resolve=>{
      try{
        const tx=db.transaction(LOCAL_SAVE_STORE,'readwrite');
        tx.objectStore(LOCAL_SAVE_STORE).put({worldId,data,updatedAt:Date.now()});
        tx.oncomplete=()=>resolve(true);
        tx.onerror=()=>resolve(false);
      }catch{
        resolve(false);
      }
    });
  }
  async function readWorldStateDb(worldId){
    const db=await openLocalSaveDb();
    if(!db||!worldId)return null;
    return new Promise(resolve=>{
      try{
        const tx=db.transaction(LOCAL_SAVE_STORE,'readonly');
        const req=tx.objectStore(LOCAL_SAVE_STORE).get(worldId);
        req.onsuccess=()=>resolve(req.result?.data||null);
        req.onerror=()=>resolve(null);
      }catch{
        resolve(null);
      }
    });
  }
  function queueWorldStateSave(data){
    pendingSaveState=data;
    if(!saveSyncTimer){
      saveSyncTimer=setInterval(()=>{
        if(!pendingSaveState||pendingSaveFlush)return;
        const snapshot=pendingSaveState;
        pendingSaveState=null;
        pendingSaveFlush=writeWorldStateDb(snapshot.worldId,snapshot).finally(()=>{pendingSaveFlush=null;});
      },SAVE_SYNC_INTERVAL_MS);
    }
  }
  function stopWorldStateSaveSync(){
    if(saveSyncTimer){clearInterval(saveSyncTimer);saveSyncTimer=null;}
  }
  async function deleteWorldStateDb(worldId){
    const db=await openLocalSaveDb();
    if(!db||!worldId)return false;
    return new Promise(resolve=>{
      try{
        const tx=db.transaction(LOCAL_SAVE_STORE,'readwrite');
        tx.objectStore(LOCAL_SAVE_STORE).delete(worldId);
        tx.oncomplete=()=>resolve(true);
        tx.onerror=()=>resolve(false);
      }catch{
        resolve(false);
      }
    });
  }
  function requestWorldSave(delayMs=800){
    if(worldMutationSuspended||!CFG.autosave)return;
    if(saveDebounceHandle)clearTimeout(saveDebounceHandle);
    saveDebounceHandle=setTimeout(()=>{
      saveDebounceHandle=null;
      saveGameLocal();
    },delayMs);
  }
  function worldStateKey(id){return `${WORLD_STATE_PREFIX}${id||'default'}`;}
  function saveGameLocal(){
     if(!CFG.autosave)return;
     try{
       const data={
        version:'0.0.89_patch6',
        seed:CURRENT_SEED,worldId:CURRENT_WORLD_ID,
         player:{x:player.pos.x,y:player.pos.y,z:player.pos.z,yaw:player.yaw,pitch:player.pitch},
         stats:{health:STATS.health,shield:STATS.shield,hunger:STATS.hunger,energy:STATS.energy,armor:STATS.armor,saturation:STATS.saturation},
         inv:{hotbar:serializeInventory(INV.hotbar),main:serializeInventory(INV.main),active:INV.active,craftGrid:serializeInventory(INV.craftGrid)},
         containers:[...(typeof containerData!=='undefined'?containerData.entries():[])].map(([k,v])=>[k,serializeInventory(v)]),
         chestMeta:[...(typeof chestMeta!=='undefined'?chestMeta.entries():[])],
         bedMeta:[...(typeof bedMeta!=='undefined'?bedMeta.entries():[])],
         chunks:serializeChunks(),
         drops:drops.map(d=>({id:d.userData.id,count:d.userData.count,x:d.position.x,y:d.position.y,z:d.position.z,vy:d.userData.vy,pickupDelay:d.userData.pickupDelay})),
         boats:boats.map(b=>({x:b.position.x,y:b.position.y,z:b.position.z,rot:b.rotation.y,vx:b.userData.vx,vy:b.userData.vy,vz:b.userData.vz})),
         mobs:mobs.map(m=>({type:m.userData.type,variant:m.userData.variant||0,sheared:!!m.userData.sheared,hp:m.userData.hp,x:m.position.x,y:m.position.y,z:m.position.z,vx:m.userData.vx,vz:m.userData.vz})),
         worldTime:{dayTime,dayCount,moonPhase},
         weather:{state:WEATHER.state,timer:WEATHER.timer,next:WEATHER.next,thunderCd:WEATHER.thunderCd},
         ts:Date.now(),
       };
       const compactState={worldId:CURRENT_WORLD_ID,seed:data.seed,player:data.player,stats:data.stats,worldTime:data.worldTime,weather:data.weather,ts:data.ts};
       localStorage.setItem(AUTOSAVE_KEY,JSON.stringify(compactState));
       localStorage.setItem(worldStateKey(CURRENT_WORLD_ID),JSON.stringify(compactState));
       localStorage.setItem(LOCAL_JSON_SAVE_KEY,JSON.stringify({worldId:CURRENT_WORLD_ID,data:compactState}));
      localStorage.setItem(SEED_KEY,String(CURRENT_SEED));
       queueWorldStateSave(data);
       const defs=loadWorldDefs();
       const existing=defs.find(w=>w.id===CURRENT_WORLD_ID);
       const playerNbt={x:data.player.x,y:data.player.y,z:data.player.z,yaw:data.player.yaw,pitch:data.player.pitch,stats:data.stats};
       const enc=encodeSavePayload({name:existing?.name||`World ${CURRENT_WORLD_ID}`,seed:data.seed,playerNbt});
       const thumb=captureWorldThumbnail();
       if(existing){
        existing.seed=data.seed;
        existing.lastPlayedAt=Date.now();
        existing.playerNbt=playerNbt;
        existing.saveBlobEnc=enc;
        existing.version=data.version;
        if(thumb)existing.thumb=thumb;
       }else{
        defs.unshift({id:CURRENT_WORLD_ID,name:`World ${CURRENT_WORLD_ID}`,seed:data.seed,createdAt:Date.now(),lastPlayedAt:Date.now(),playerNbt,saveBlobEnc:enc,version:data.version,thumb:thumb||''});
       }
       saveWorldDefs(defs);
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
  async function loadWorldState(id){
    const dbState=await readWorldStateDb(id);
    if(dbState?.player)return dbState;
    try{
      const raw=localStorage.getItem(worldStateKey(id));
      if(!raw){
        const auto=loadAutosaveLocal();
        return auto?.worldId===id?auto:null;
      }
      const data=JSON.parse(raw);
      if(data?.saveBlobEnc&&!data.seed){
        const blob=decodeSavePayload(data.saveBlobEnc);
        if(blob?.seed)data.seed=blob.seed;
      }
      return data&&data.player?data:null;
    }catch{return null;}
  }

  function clearWorldState(){
    stopWorldStateSaveSync();
    if(saveDebounceHandle){clearTimeout(saveDebounceHandle);saveDebounceHandle=null;}
    for(const k of chunkMeshes.keys()){
      const m=chunkMeshes.get(k);
      removeAndDisposeSceneObject(m);
    }
    chunkMeshes.clear();
    chunkData.clear();
    loadedChunks.clear();
    chunkQueue.length=0;
    for(let i=drops.length-1;i>=0;i--){removeAndDisposeSceneObject(drops[i]);}
    drops.length=0;
    for(let i=fallingBlockEntities.length-1;i>=0;i--){removeAndDisposeSceneObject(fallingBlockEntities[i]);}
    fallingBlockEntities.length=0;
    fallingBlockKeys.clear();
    if(typeof containerData!=='undefined')containerData.clear();
    if(typeof chestPairs!=='undefined')chestPairs.clear();
    if(typeof chestMeta!=='undefined')chestMeta.clear();
    if(typeof bedMeta!=='undefined')bedMeta.clear();
    primedTnts.forEach(t=>removeAndDisposeSceneObject(t?.mesh));
    primedTnts.length=0;
    for(const l of torchLights.values())scene.remove(l);
    torchLights.clear();
    for(let i=projectiles.length-1;i>=0;i--){removeAndDisposeSceneObject(projectiles[i]);}
    projectiles.length=0;
    for(let i=chestShineFx.length-1;i>=0;i--){removeAndDisposeSceneObject(chestShineFx[i]);}
    chestShineFx.length=0;
    for(const b of boats)removeAndDisposeSceneObject(b);
    boats.length=0;
    for(const m of mobs)removeAndDisposeSceneObject(m);
    mobs.length=0;
    for(let i=rainDrops.length-1;i>=0;i--){removeAndDisposeSceneObject(rainDrops[i]);}
    rainDrops.length=0;
    ridingBoat=null;
  }

  function applyGuiScale(){
    const level=Math.max(1,Math.min(4,Math.round(CFG.guiScale)));
    const scaleMap={1:0.72,2:0.88,3:1,4:1.1};
    const scale=scaleMap[level]||1;
    document.documentElement.style.setProperty('--gui-scale',String(scale));
    document.documentElement.style.setProperty('--meter-offset',`${254*scale}px`);
    document.documentElement.style.setProperty('--meter-bottom',`${64*scale}px`);
  }
  function applyNixPlusPreset(){
    CFG.leavesQuality='ultra';
    CFG.shadowsMode='high';
    CFG.particlesMode='ultra';
    CFG.cloudsMode='ultra';
    CFG.renderDist=Math.max(CFG.renderDist,10);
    CFG.simDist=Math.max(CFG.simDist,8);
  }
  function isNixLockedSetting(key){
    return !!CFG.enableNixPlus&&['leavesQuality','shadowsMode','particlesMode','cloudsMode'].includes(key);
  }
   
   function buildSettingsTab(tab){
     const body=document.getElementById('settings-body');body.innerHTML='';
     body.style.gridTemplateColumns=tab==='controls'?'1fr':'1fr 1fr';
     const list=tab==='video'?VIDEO_SETTINGS:(tab==='player'?PLAYER_SETTINGS:(tab==='controls'?CONTROL_SETTINGS:EXPERIMENTAL_SETTINGS));
     list.forEach(s=>{
       const row=document.createElement('div');row.className='setting-row';
       if(s.key==='_optimize')row.id='settings-optimize';
       const lbl=document.createElement('label');lbl.textContent=s.label;row.appendChild(lbl);
       if(tab==='controls'){
         const btn=document.createElement('button');
         btn.className='setting-btn'+(isDuplicateKeybind(s.action)?' duplicate':'');
         btn.textContent=keybindCaptureAction===s.action?'...':formatKeyCode(KEYBINDS[s.action]);
         btn.addEventListener('click',()=>{
           keybindCaptureAction=keybindCaptureAction===s.action?null:s.action;
           buildSettingsTab('controls');
         });
         row.appendChild(btn);
       }else if(s.type==='range'){
         const val=document.createElement('span');
         const fmt=v=>parseFloat(v).toFixed(s.step<0.01?4:s.step<1?2:0)+(s.unit||'');
         val.textContent=fmt(CFG[s.key]);
         const inp=document.createElement('input');inp.type='range';inp.min=s.min;inp.max=s.max;inp.step=s.step;inp.value=CFG[s.key];
         const locked=isNixLockedSetting(s.key);
         inp.disabled=locked;
         if(locked)row.classList.add('setting-locked');
         inp.addEventListener('input',()=>{CFG[s.key]=parseFloat(inp.value);val.textContent=fmt(inp.value);applySettings();});
         row.appendChild(inp);row.appendChild(val);
       }else if(s.type==='toggle'){
         const btn=document.createElement('button');btn.className='setting-btn';btn.textContent=CFG[s.key]?'ON':'OFF';
         const locked=isNixLockedSetting(s.key);
         btn.disabled=locked;
         if(locked)row.classList.add('setting-locked');
         btn.addEventListener('click',()=>{CFG[s.key]=!CFG[s.key];btn.textContent=CFG[s.key]?'ON':'OFF';applySettings();buildSettingsTab(tab);});
         row.appendChild(btn);
       }else if(s.type==='select'){
         const btn=document.createElement('button');btn.className='setting-btn';btn.textContent=CFG[s.key];
         const locked=isNixLockedSetting(s.key);
         btn.disabled=locked;
         if(locked)row.classList.add('setting-locked');
         btn.addEventListener('click',()=>{
           const opts=s.opts;const ci=opts.indexOf(CFG[s.key]);CFG[s.key]=opts[(ci+1)%opts.length];
           btn.textContent=CFG[s.key];applySettings();buildSettingsTab(tab);
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
   if(nixPlus)applyNixPlusPreset();
   const shScale=qualityFactor(CFG.shadowsMode);
   renderer.shadowMap.enabled=nixPlus?false:shScale>0;
   renderer.setPixelRatio((nixPlus?1:Math.min(window.devicePixelRatio,2))*PERF_STATE.renderScale);
   const canvasEl=document.getElementById('game-canvas');
   updateDynamicCanvasFilter(1,1);
     const fn=CFG.renderDist*16*CFG.fogDensity;
    scene.fog.near=fn*0.5;scene.fog.far=fn;
    const cScale=cloudCountScale();
    clouds.forEach((c,i)=>{c.visible=cloudsEnabled()&&(i<Math.floor(clouds.length*Math.max(0.15,cScale)));});
    sun.castShadow=!nixPlus&&shScale>0;
    sun.shadow.mapSize.set(shScale>=1.15?3072:shScale>=0.95?2048:shScale>=0.7?1536:1024,shScale>=1.15?3072:shScale>=0.95?2048:shScale>=0.7?1536:1024);
    sunMesh.visible=!!CFG.showSunMoon;
    moonMesh.visible=!!CFG.showSunMoon;
    applyTouchControllerVisibility();
    applyGuiScale();
    saveSettingsLocal();
  }
   
  function updateDynamicCanvasFilter(weatherSat=1,sunLevel=1){
    const canvasEl=document.getElementById('game-canvas');
    const nightDim=sunLevel<=0.06?0.68:(sunLevel<=0.2?0.82:1);
    const base=[];
    if(CFG.enableNixPlus){
      const sat=Math.max(0.8,Math.min(1.8,CFG.nixSaturation));
      const con=Math.max(0.8,Math.min(1.6,CFG.nixContrast));
      const glow=Math.max(0,Math.min(1,CFG.nixGlow));
      base.push(`saturate(${(sat*weatherSat).toFixed(2)})`,`contrast(${con.toFixed(2)})`,`brightness(${(1+glow*0.12)*nightDim})`);
    }else{
      base.push(`saturate(${weatherSat.toFixed(2)})`,`brightness(${nightDim})`);
    }
    canvasEl.style.filter=base.join(' ');
  }

  function optimizeSettings(){
     const hi=window.devicePixelRatio>=2&&(navigator.hardwareConcurrency||4)>=8;
     CFG.renderDist=hi?10:6;CFG.simDist=hi?8:4;CFG.shadowsMode=hi?'ultra':'low';CFG.particlesMode=hi?'ultra':'default';CFG.cloudsMode=hi?'ultra':'medium';CFG.leavesQuality=hi?'ultra':'default';CFG.fogDensity=hi?0.8:0.55;
     renderer.setPixelRatio(hi?Math.min(window.devicePixelRatio,2):1);
     applySettings();
   }

   loadSettingsLocal();
   
   function openSettings(){
     settingsContext='pause';
     document.getElementById('pause-menu').style.display='none';
     document.getElementById('settings-menu').style.display='flex';
     document.querySelectorAll('.stab').forEach(b=>b.classList.remove('active'));
     document.querySelector('.stab[data-tab="video"]').classList.add('active');
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
     keybindCaptureAction=null;
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
   
   function processChunkQueue(maxPerFrame=1,timeBudgetMs=4){
     const startedAt=performance.now();
     for(let i=0;i<maxPerFrame&&chunkQueue.length>0;i++){
       const{cx,cz}=chunkQueue.shift();
       if(!getArr(cx,cz,false))generateChunk(cx,cz);
       buildChunkMesh(cx,cz);
       if(performance.now()-startedAt>=timeBudgetMs)break;
     }
   }
   
   // ═══════════════════════════════════════════════════════════
   // 16. DAY/NIGHT
   // ═══════════════════════════════════════════════════════════
   const DAY=1200;let dayTime=0;let dayCount=0;
   const SKY={day:new THREE.Color(0x87ceeb),sunset:new THREE.Color(0xff8844),night:new THREE.Color(0x010205),rain:new THREE.Color(0xb7c0ca),thunder:new THREE.Color(0x525861)};
  function applyWeatherVisuals(baseSky,baseAmb,baseSun){
    const weatherMix=Math.max(0,Math.min(1,WEATHER.blend||0));
    const targetSky=WEATHER.state==='thunder'?SKY.thunder:SKY.rain;
    const stormStrength=WEATHER.state==='thunder'?1:0.72;
    const finalSky=baseSky.clone().lerp(targetSky,weatherMix);
    finalSky.lerp(new THREE.Color(0xbfc3ca),Math.max(0,weatherMix-(baseSun*0.35))*0.65);
    const nightDarken=baseSun<=0.06?0.55:1;
    const ambientMul=(1-(stormStrength*0.62*weatherMix))*nightDarken;
    const sunMul=(1-(stormStrength*0.9*weatherMix))*nightDarken;
    const saturation=1-(WEATHER.state==='thunder'?0.78:0.58)*weatherMix;
    return {sky:finalSky,amb:baseAmb*ambientMul,sun:baseSun*sunMul,stormStrength,saturation};
  }
  function updateCloudDeck(dt){
    const cScale=cloudCountScale();
    const targetCover=WEATHER.state==='thunder'?1:WEATHER.state==='rain'?0.86:Math.max(0.15,cScale*0.55);
    const visibleCount=Math.floor(clouds.length*Math.max(0.15,Math.min(1,targetCover*Math.max(0.2,cScale||1))));
    const cloudShade=WEATHER.state==='thunder'?0x454950:WEATHER.state==='rain'?0xbfc4cb:0xffffff;
    cloudMat.color.setHex(cloudShade);
    cloudMat.opacity=0.54+(WEATHER.state==='clear'?0.26:WEATHER.state==='rain'?0.34:0.42)*Math.max(0.35,cScale);
    clouds.forEach((c,i)=>{c.visible=cloudsEnabled()&&(i<visibleCount);});
  }
  function updateDayNight(dt){
    const prev=dayTime;
    dayTime=(dayTime+dt/DAY)%1;
    if(dayTime<prev){dayCount++;moonPhase=(dayCount%8)+1;TEX.moonDisc=makeMoonPhaseTex(moonPhase);moonMesh.material.map=TEX.moonDisc;moonMesh.material.needsUpdate=true;requestWorldSave(240);}
    const ang=(dayTime*2-0.5)*Math.PI,R=200;
    const orbitSun=new THREE.Vector3(Math.cos(ang)*R,Math.sin(ang)*R,0);
    const orbitMoon=new THREE.Vector3(-Math.cos(ang)*R,-Math.sin(ang)*R,0);
    sun.position.copy(camera.position).add(orbitSun);
    moon.position.copy(camera.position).add(orbitMoon);
    sunMesh.position.copy(camera.position).add(orbitSun.clone().multiplyScalar(0.95));
    moonMesh.position.copy(camera.position).add(orbitMoon.clone().multiplyScalar(0.95));
    sunMesh.lookAt(camera.position);
    moonMesh.lookAt(camera.position);
     const t=dayTime;let skyC,amb,si;
     if(t<0.25){const f=t/0.25;skyC=SKY.day.clone();amb=0.24+f*0.32;si=0.55+f*0.45;}
     else if(t<0.5){const f=(t-0.25)/0.25;skyC=SKY.day.clone().lerp(SKY.sunset,f);amb=0.56-f*0.2;si=1-f*0.5;}
     else if(t<0.6){const f=(t-0.5)/0.1;skyC=SKY.sunset.clone().lerp(SKY.night,f);amb=0.36-f*0.32;si=0.5-f*0.5;}
     else if(t<0.9){skyC=SKY.night.clone();amb=0.025;si=0;}
     else{const f=(t-0.9)/0.1;skyC=SKY.night.clone().lerp(SKY.sunset,f);amb=0.025+f*0.18;si=f*0.5;}
     const weatherFx=applyWeatherVisuals(skyC,amb,si);
     renderer.setClearColor(weatherFx.sky,1);skyMat.color.copy(weatherFx.sky);scene.fog.color.copy(weatherFx.sky);
     ambL.intensity=weatherFx.amb*CFG.brightness;
     sun.intensity=weatherFx.sun;
     moon.intensity=si<0.1?0.18*Math.max(0.45,1-weatherFx.stormStrength*Math.max(0,WEATHER.blend||0)):0;
     sun.color.setHex(0xffde45);
     moon.color.setHex(0xf5f7ff);
     sunMat.color.setHex(0xffdd66);
     moonMat.color.setHex(0xdfe8ff);
     sunMat.opacity=Math.max(0.18,Math.min(1,0.4+weatherFx.sun*0.7));
     moonMat.opacity=Math.max(0.18,Math.min(1,0.22+moon.intensity*3.2));
     starsMesh.material.opacity=Math.max(0,Math.min(1,(0.16-si)*6))*(1-Math.max(0,WEATHER.blend||0)*0.9);
     starsMesh.visible=starsMesh.material.opacity>0.02;
     updateDynamicCanvasFilter(weatherFx.saturation,si);
     sunMesh.visible=!!CFG.showSunMoon;
     moonMesh.visible=!!CFG.showSunMoon;
  }
  const WEATHER={state:'clear',timer:420,next:900,thunderCd:12,blend:0};
  const rainDrops=[];
  function scheduleNextWeather(){
    const clearDur=600+Math.random()*8400;
    const wetDur=600+Math.random()*600;
    if(WEATHER.state==='clear'){
      WEATHER.state=Math.random()<0.72?'rain':'thunder';
      WEATHER.next=wetDur;
    }else{
      WEATHER.state='clear';
      WEATHER.next=clearDur;
    }
    WEATHER.timer=0;
  }
  function spawnRainDrop(){
    const p=new THREE.Mesh(new THREE.PlaneGeometry(0.03,0.55),new THREE.MeshBasicMaterial({color:0x88b7ff,transparent:true,opacity:0.7,side:THREE.DoubleSide,depthWrite:false}));
    p.position.set(player.pos.x+(Math.random()-0.5)*26,player.pos.y+12+Math.random()*8,player.pos.z+(Math.random()-0.5)*26);
    p.userData={life:0.8,speed:16+Math.random()*7};
    scene.add(p);rainDrops.push(p);
  }
  function strikeLightning(){
    const wx=Math.floor(player.pos.x)+(((Math.random()*140)|0)-70);
    const wz=Math.floor(player.pos.z)+(((Math.random()*140)|0)-70);
    const y=getSurfaceY(wx,wz);
    if(y<1)return;
    const bolt=new THREE.Mesh(new THREE.PlaneGeometry(0.28,Math.max(8,CFG.chunkH-y)),new THREE.MeshBasicMaterial({color:0xdff5ff,transparent:true,opacity:0.92,side:THREE.DoubleSide,depthWrite:false}));
    bolt.position.set(wx+0.5,y+bolt.geometry.parameters.height*0.5,wz+0.5);
    bolt.userData={life:0.15};
    scene.add(bolt);rainDrops.push(bolt);
    if(Math.hypot(player.pos.x-(wx+0.5),player.pos.z-(wz+0.5))<2.2){applyDamage(16,true);}
    for(const m of mobs){
      if(Math.hypot(m.position.x-(wx+0.5),m.position.z-(wz+0.5))<2.2){m.userData.burnT=3.5;m.userData.hp-=12;}
    }
    worldSet(wx,y+1,wz,B.FIRE);buildChunkMesh(Math.floor(wx/16),Math.floor(wz/16));
  }
  function updateWeather(dt){
    if(!CFG.enableWeather){WEATHER.state='clear';WEATHER.timer=0;WEATHER.blend=0;updateCloudDeck(dt);return;}
    WEATHER.timer+=dt;
    const targetBlend=WEATHER.state==='clear'?0:1;
    WEATHER.blend+=Math.sign(targetBlend-WEATHER.blend)*Math.min(Math.abs(targetBlend-WEATHER.blend),dt*(WEATHER.state==='thunder'?0.45:0.28));
    if(WEATHER.timer>=WEATHER.next)scheduleNextWeather();
    const raining=WEATHER.state==='rain'||WEATHER.state==='thunder';
    if(raining){
      for(let i=0;i<10;i++)spawnRainDrop();
      for(let i=rainDrops.length-1;i>=0;i--){
        const r=rainDrops[i];
        r.userData.life-=dt;
        r.position.y-=((r.userData.speed)||18)*dt;
        if(r.userData.life<=0||r.position.y<player.pos.y-2){scene.remove(r);r.geometry.dispose();r.material.dispose();rainDrops.splice(i,1);}
      }
      if(Math.random()<0.18){
        const wx=Math.floor(player.pos.x)+(((Math.random()*30)|0)-15),wz=Math.floor(player.pos.z)+(((Math.random()*30)|0)-15),wy=Math.floor(player.pos.y)+(((Math.random()*14)|0)-7);
        if(worldGet(wx,wy,wz)===B.FIRE){worldSet(wx,wy,wz,B.AIR);buildChunkMesh(Math.floor(wx/16),Math.floor(wz/16));}
        if(worldGet(wx,wy,wz)===B.FARMLAND_DRY){worldSet(wx,wy,wz,B.FARMLAND_WET);buildChunkMesh(Math.floor(wx/16),Math.floor(wz/16));}
      }
      if(WEATHER.state==='thunder'){
        WEATHER.thunderCd-=dt;
        if(WEATHER.thunderCd<=0){WEATHER.thunderCd=7+Math.random()*14;if(Math.random()<0.24)strikeLightning();}
      }
    }else{
      for(let i=rainDrops.length-1;i>=0;i--){removeAndDisposeSceneObject(rainDrops[i]);rainDrops.splice(i,1);}
      WEATHER.thunderCd=10;
    }
    updateCloudDeck(dt);
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
  function updateStatusVignette(dt){
    hurtFlashT=Math.max(0,hurtFlashT-dt*0.65);
    healFlashT=Math.max(0,healFlashT-dt*0.9);
    const starving=STATS.hunger<=0?0.24:(STATS.hunger<=3?0.12:0);
    const lowHp=STATS.health<=25?((25-STATS.health)/25)*0.28:0;
    const hurt=Math.max(starving,lowHp,hurtFlashT);
    const heal=Math.max(0,healFlashT-(hurt*0.4));
    const overlay=document.getElementById('status-vignette');
    if(!overlay)return;
    if(heal>hurt){
      overlay.style.background='radial-gradient(circle at center, rgba(0,0,0,0) 44%, rgba(40,170,70,0.30) 100%)';
      overlay.style.opacity=String(Math.min(0.55,heal));
    }else{
      overlay.style.background='radial-gradient(circle at center, rgba(0,0,0,0) 45%, rgba(160,0,0,0.34) 100%)';
      overlay.style.opacity=String(Math.min(0.72,hurt));
    }
  }
  function updatePerformanceAdaptation(dt){
    if(document.visibilityState==='hidden')return;
    if(fps>0&&fps<32){
      PERF_STATE.lowFpsT+=dt;
      PERF_STATE.highFpsT=0;
    }else if(fps>56){
      PERF_STATE.highFpsT+=dt;
      PERF_STATE.lowFpsT=0;
    }else{
      PERF_STATE.lowFpsT=Math.max(0,PERF_STATE.lowFpsT-dt*0.5);
      PERF_STATE.highFpsT=Math.max(0,PERF_STATE.highFpsT-dt*0.5);
    }
    if(PERF_STATE.lowFpsT>4&&PERF_STATE.renderScale>0.7){
      PERF_STATE.renderScale=Math.max(0.7,PERF_STATE.renderScale-0.1);
      PERF_STATE.lowFpsT=0;
      applySettings();
    }else if(PERF_STATE.highFpsT>7&&PERF_STATE.renderScale<1){
      PERF_STATE.renderScale=Math.min(1,PERF_STATE.renderScale+0.1);
      PERF_STATE.highFpsT=0;
      applySettings();
    }
  }
   
   // ═══════════════════════════════════════════════════════════
   // 19. DEBUG HUD
   // ═══════════════════════════════════════════════════════════
   let fps=0,fpsT=0,fpsN=0;
  function updateHUD(dt){
    fpsN++;fpsT+=dt;if(fpsT>=0.5){fps=Math.round(fpsN/fpsT);fpsN=0;fpsT=0;}
    const p=player.pos,tod=dayTime<0.5?'Day':'Night';
    if(!showDebugOverlay){document.getElementById('hud-debug').innerHTML='';return;}
    document.getElementById('hud-debug').innerHTML=
      `XYZ: ${p.x.toFixed(1)} / ${p.y.toFixed(1)} / ${p.z.toFixed(1)}<br>`+
      `FPS: ${fps} | Chunks: ${loadedChunks.size} | ${tod} | Moon ${moonPhase} | Seed: ${CURRENT_SEED}<br>`+`Border: ${(WORLD_BORDER_BLOCKS-Math.max(Math.abs(p.x),Math.abs(p.z))).toFixed(0)} blocks`;
  }
   
   // ═══════════════════════════════════════════════════════════
   // 20. MAIN LOOP
   // ═══════════════════════════════════════════════════════════
   let lastNow=performance.now(),chunkT=0,fallT=0,autosaveT=0,waterFlowT=0,lavaFlowT=0,fireT=0;
  let worldLoadLock=false;
  function loop(){
     requestAnimationFrame(loop);
    const now=performance.now();const dt=Math.min((now-lastNow)*0.001,0.05);lastNow=now;
    if(!isPaused){
      updateSurvivalStats(dt);
      updateControllerInput();
      updateEating(dt);
      if(bowChargeActive)bowChargeTime=Math.min(2,bowChargeTime+dt);
      handPhase+=dt*9;
      if(worldLoadLock){
        const pcx=Math.floor(player.pos.x/16),pcz=Math.floor(player.pos.z/16);
        if(loadedChunks.has(`${pcx},${pcz}`)&&chunkQueue.length===0)worldLoadLock=false;
      }else{
       movePlayer(dt);raycastWorld();tickBreaking(dt);
       if(POINTER_STATE.primary&&document.pointerLockElement&&targetBlock&&!breaking.active&&!isInvOpen&&!isChatOpen)startBreaking();
      }
       updateBoats(dt);updateParticles(dt);updateProjectiles(dt);updateChestShineFx(dt);updateDrops(dt);updatePrimedTnts(dt);updateGrassGrowth(dt);updateFarmland(dt);updateMobs(dt);
       updateDayNight(dt);updateWeather(dt);updateAnimTex(dt);
       clouds.forEach(c=>{c.position.x+=c.userData.spd*dt;if(c.position.x>200)c.position.x=-200;});
       chunkT+=dt;if(chunkT>0.35){chunkT=0;updateChunks();}
      fallT+=dt;if(fallT>0.25){fallT=0;updateFallingBlocks();}
      waterFlowT+=dt;if(waterFlowT>0.12){waterFlowT=0;flowFluidOnce(B.WATER,10);}
      lavaFlowT+=dt;if(lavaFlowT>0.62){lavaFlowT=0;flowFluidOnce(B.LAVA,7);}
      fireT+=dt;if(fireT>0.45){fireT=0;updateFireBlocks();}
      updateUnsupportedTorches();
      updateFallingEntities(dt);
       updateLeavesDecay(dt);
     processChunkQueue(worldLoadLock?2:1,worldLoadLock?7:3);
     }
    const targetFov=bowChargeActive?(CFG.fov-(Math.min(1,bowChargeTime/1.2)*8)):CFG.fov;
    if(Math.abs(camera.fov-targetFov)>0.01){camera.fov=targetFov;camera.updateProjectionMatrix();}
     if(sleeping.active)updateSleepAnimation(dt);
     drawHand();
     autosaveT+=dt;
     if(autosaveT>=15){autosaveT=0;saveGameLocal();}
     updateStatusUI();updateStatusVignette(dt);updateHUD(dt);updatePerformanceAdaptation(dt);
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
  async function startGame(opts={}){
     const options=typeof opts==='boolean'?{regenerate:opts}:opts;
     const isRegenerate=!!options.regenerate;
     const starterChest=options.starterChest!==false;
     const developerChestEnabled=!!options.developerChest;
     CURRENT_WORLD_ID=options.worldId||CURRENT_WORLD_ID||'default';
     CFG.autosave=true;
     worldMutationSuspended=true;
     isPaused=false;
     closeChat();
     if(isInvOpen)closeUiScreen();
     document.getElementById('pause-menu').style.display='none';
    clearWorldState();
    const savedWorldState=!isRegenerate?await loadWorldState(CURRENT_WORLD_ID):null;
    worldLoadLock=!!savedWorldState;
     const chosenSeed=(options.seed!==undefined&&options.seed!==null&&String(options.seed).trim()!=='')?Number(options.seed):randomSeed();
     const useSeed=savedWorldState?.seed??chosenSeed;
     setWorldSeed(Number.isFinite(useSeed)?Math.floor(useSeed):randomSeed());
     document.getElementById('main-menu').style.display='none';
     const loadingEl=document.getElementById('loading-screen');
     loadingEl.style.transition='none';
     loadingEl.style.opacity='1';
     loadingEl.style.display='flex';
    const isLoadingSaved=!!(savedWorldState&&!isRegenerate);
    document.getElementById('loading-sub').textContent=isRegenerate?'Generating New World...':(isLoadingSaved?'Loading Saved World...':'Generating World...');
     document.getElementById('game-canvas').style.display='block';
     document.getElementById('game-ui').style.display='block';
    applyHudVisibility();
   
     setLoad(5,isRegenerate?'GENERATING NEW WORLD':(isLoadingSaved?'PREPARING SAVED WORLD':'PREPARING WORLD'));

     const cx0=savedWorldState?.player?Math.floor((savedWorldState.player.x||0)/16):0;
     const cz0=savedWorldState?.player?Math.floor((savedWorldState.player.z||0)/16):0;

     setLoad(12,'GENERATING TERRAIN');
     const R=3;
     const coords=[];
     for(let dx=-R;dx<=R;dx++)for(let dz=-R;dz<=R;dz++)coords.push({cx:cx0+dx,cz:cz0+dz});
     const genTotal=Math.max(1,coords.length);
     let done=0,lastYield=performance.now();
     if(savedWorldState?.chunks?.length){
       deserializeChunks(savedWorldState.chunks);
       setLoad(64,'LOADING SAVED WORLD');
     }else{
       for(const {cx,cz} of coords){
         generateChunk(cx,cz);done++;
         if(performance.now()-lastYield>10){
           setLoad(12+Math.round(done/genTotal*52),'GENERATING TERRAIN');
           await delay(0);lastYield=performance.now();
         }
       }
       setLoad(64,'GENERATING TERRAIN');
     }

    // Always start a new world in singleplayer for now
    STATS.health=STATS.maxHealth;STATS.shield=STATS.maxShield;STATS.hunger=STATS.maxHunger;STATS.energy=STATS.maxEnergy;STATS.air=STATS.maxAir;STATS.saturation=STATS.maxSaturation*0.5;
    STATS.armor=0;
    INV.hotbar=Array(9).fill(null);
    INV.main=Array(27).fill(null);
    if(typeof chestMeta!=='undefined')chestMeta.clear();
    if(typeof bedMeta!=='undefined')bedMeta.clear();
    if(typeof containerData!=='undefined')containerData.clear();
    if(savedWorldState?.inv){
      INV.hotbar=deserializeInventory(savedWorldState.inv.hotbar,9);
      INV.main=deserializeInventory(savedWorldState.inv.main,27);
      INV.active=Math.max(0,Math.min(8,savedWorldState.inv.active|0));
    }
    if(savedWorldState?.containers){
      for(const [k,v] of savedWorldState.containers){
        if(typeof k!=='string')continue;
        containerData.set(k,deserializeInventory(v,Array.isArray(v)?v.length:27));
      }
    }
    if(savedWorldState?.chestMeta&&typeof chestMeta!=='undefined'){
      for(const [k,v] of savedWorldState.chestMeta){if(typeof k==='string')chestMeta.set(k,v||{});}
    }
    if(savedWorldState?.bedMeta&&typeof bedMeta!=='undefined'){
      for(const [k,v] of savedWorldState.bedMeta){if(typeof k==='string')bedMeta.set(k,v||{});}
    }
    setCraftingSize(2,false);
    INV.uiMode='inventory';
    if(!savedWorldState?.inv)INV.active=0;
    if(savedWorldState?.player){
      player.pos.set(savedWorldState.player.x,savedWorldState.player.y,savedWorldState.player.z);
      player.yaw=savedWorldState.player.yaw||0;player.pitch=savedWorldState.player.pitch||0;
      STATS.health=Math.max(0,Math.min(STATS.maxHealth,savedWorldState.stats?.health??STATS.maxHealth));
      STATS.shield=Math.max(0,Math.min(STATS.maxShield,savedWorldState.stats?.shield??STATS.maxShield));
      STATS.hunger=Math.max(0,Math.min(STATS.maxHunger,savedWorldState.stats?.hunger??STATS.maxHunger));
      STATS.energy=Math.max(0,Math.min(STATS.maxEnergy,savedWorldState.stats?.energy??STATS.maxEnergy));
      STATS.saturation=Math.max(0,Math.min(STATS.maxSaturation,savedWorldState.stats?.saturation??(STATS.maxSaturation*0.5)));
      dayTime=Math.max(0,Math.min(0.9999,savedWorldState.worldTime?.dayTime??0));
      dayCount=Math.max(0,Math.floor(savedWorldState.worldTime?.dayCount??0));
      moonPhase=Math.max(1,Math.min(8,Math.floor(savedWorldState.worldTime?.moonPhase??((dayCount%8)+1))));
      TEX.moonDisc=makeMoonPhaseTex(moonPhase);moonMesh.material.map=TEX.moonDisc;moonMesh.material.needsUpdate=true;
      if(savedWorldState.weather&&CFG.enableWeather){
        WEATHER.state=savedWorldState.weather.state||'clear';
        WEATHER.timer=Math.max(0,savedWorldState.weather.timer||0);
        WEATHER.next=Math.max(60,savedWorldState.weather.next||WEATHER.next);
        WEATHER.thunderCd=Math.max(1,savedWorldState.weather.thunderCd||8);
        WEATHER.blend=(WEATHER.state==='clear'?0:1);
      }
    }else{
      dayTime=0;dayCount=0;moonPhase=1;TEX.moonDisc=makeMoonPhaseTex(moonPhase);moonMesh.material.map=TEX.moonDisc;moonMesh.material.needsUpdate=true;
      WEATHER.state='clear';WEATHER.timer=0;WEATHER.next=900;WEATHER.thunderCd=10;WEATHER.blend=0;
      const spawn=findSafeSpawn(100,cx0*16,cz0*16);
      if(spawn)player.pos.set(spawn.wx+0.5,spawn.y+1,spawn.wz+0.5);
      else{
        const y=Math.max(CFG.seaLevel+2,getHeight(cx0*16,cz0*16)+1);
        player.pos.set(cx0*16+0.5,y,cz0*16+0.5);
      }
    }
    player.vel.set(0,0,0);
    player.onGround=false;
    player.height=player.standHeight;
    player.eyeOffset=player.standEyeOffset;
    camera.position.set(player.pos.x,player.pos.y+player.eyeOffset,player.pos.z);

    if(!savedWorldState&&starterChest){
      const frontX=Math.round(-Math.sin(player.yaw))||1;
      const frontZ=Math.round(-Math.cos(player.yaw));
      const chestX=Math.floor(player.pos.x)+frontX;
      const chestZ=Math.floor(player.pos.z)+frontZ;
      const chestY=Math.max(1,Math.floor(player.pos.y));
      worldSet(chestX,chestY,chestZ,B.CHEST);
      const alphaKey=worldPosKey(chestX,chestY,chestZ);
      const alphaSlots=ensureContainer(alphaKey,chestCapacity(B.CHEST,alphaKey));
      const STARTER_LOOT_TABLE=[
        {id:B.PLANKS,min:12,max:36,w:10},{id:IT.STICK,min:6,max:24,w:9},{id:B.TORCH,min:6,max:28,w:9},{id:IT.COAL,min:3,max:16,w:8},
        {id:B.COBBLESTONE,min:10,max:32,w:8},{id:IT.FLINT_STEEL,min:1,max:1,w:4},{id:IT.BUCKET,min:1,max:1,w:3},{id:IT.ARROW,min:6,max:18,w:6},
        {id:IT.IRON_INGOT,min:2,max:8,w:4},{id:IT.BOW,min:1,max:1,w:2},
      ];
      const rolls=5+((Math.random()*4)|0);
      for(let i=0;i<rolls&&i<alphaSlots.length;i++){
        const total=STARTER_LOOT_TABLE.reduce((a,b)=>a+b.w,0);
        let pick=Math.random()*total,entry=STARTER_LOOT_TABLE[0];
        for(const e of STARTER_LOOT_TABLE){pick-=e.w;if(pick<=0){entry=e;break;}}
        const count=entry.min+((Math.random()*((entry.max-entry.min)+1))|0);
        alphaSlots[i]=makeItemStack(entry.id,count);
      }
    }
    if(!savedWorldState&&developerChestEnabled){
      const chestX=Math.floor(player.pos.x)-1;
      const chestZ=Math.floor(player.pos.z);
      const chestY=Math.max(1,Math.floor(player.pos.y));
      worldSet(chestX,chestY,chestZ,B.DEV_CHEST);
      const devKey=worldPosKey(chestX,chestY,chestZ);
      setChestMeta(devKey,{noPair:true,placedSneak:true,nbt:{developer:true}});
      const slots=ensureContainer(devKey,chestCapacity(B.DEV_CHEST,devKey));
      const allIds=getAllKnownIds();
      for(let i=0;i<slots.length&&i<allIds.length;i++)slots[i]=makeItemStack(allIds[i],getMaxStackForId(allIds[i]));
    }
    if(savedWorldState?.drops){
      for(const d of savedWorldState.drops)spawnDropStack(Math.floor(d.x),Math.floor(d.y),Math.floor(d.z),d.id,d.count,d.pickupDelay||0);
    }
    if(savedWorldState?.boats){
      for(const b of savedWorldState.boats){
        const boat=spawnBoat(Math.floor(b.x),Math.floor(b.y),Math.floor(b.z),b.rot||0);
        boat.position.set(b.x,b.y,b.z);
        boat.userData.vx=b.vx||0;boat.userData.vy=b.vy||0;boat.userData.vz=b.vz||0;
      }
    }
    if(savedWorldState?.mobs){
      for(const m of savedWorldState.mobs){
        const mob=spawnMob(m.type,Math.floor(m.x),Math.floor(m.y),Math.floor(m.z),m.variant||0);
        if(!mob)continue;
        mob.position.set(m.x,m.y,m.z);
        mob.userData.hp=m.hp||mob.userData.hp;
        mob.userData.vx=m.vx||0;mob.userData.vz=m.vz||0;
        mob.userData.sheared=!!m.sheared;
        updateSheepAppearance(mob);
      }
    }

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
     worldMutationSuspended=false;
     requestWorldSave(120);
     if(!window.__cubenixLoopStarted){window.__cubenixLoopStarted=true;loop();}
   }
   function delay(ms){return new Promise(r=>setTimeout(r,ms));}
   
   // ═══════════════════════════════════════════════════════════
   // 22. MAIN MENU ANIMATION
   // ═══════════════════════════════════════════════════════════
   (function initMenu(){
    const mc=document.getElementById('menu-canvas');
    const mg=mc.getContext('2d');
    const pano=document.createElement('canvas');
    const pg=pano.getContext('2d');
    pano.width=1600;pano.height=900;
    function buildPanorama(){
      const sky=pg.createLinearGradient(0,0,0,pano.height);
      sky.addColorStop(0,'#7cb7f2');
      sky.addColorStop(0.55,'#b6d8f5');
      sky.addColorStop(1,'#dceefc');
      pg.fillStyle=sky;pg.fillRect(0,0,pano.width,pano.height);
      for(let i=0;i<18;i++){
        const x=i*(pano.width/15)-120;
        const y=100+((i%4)*18);
        pg.fillStyle='rgba(255,255,255,0.8)';
        pg.fillRect(x,y,150,34);pg.fillRect(x+36,y-18,90,28);
      }
      const ridgeColors=['#527d43','#456c39','#385b31'];
      ridgeColors.forEach((col,idx)=>{
        pg.fillStyle=col;pg.beginPath();pg.moveTo(0,pano.height);
        for(let x=0;x<=pano.width+80;x+=80){
          const base=540+idx*90;
          const amp=idx===0?46:idx===1?78:108;
          const y=base+Math.sin((x+idx*130)*0.01)*amp+Math.cos((x+idx*70)*0.018)*amp*0.35;
          pg.lineTo(x,y);
        }
        pg.lineTo(pano.width,pano.height);pg.closePath();pg.fill();
      });
      for(let i=0;i<34;i++){
        const x=80+i*42;
        const h=80+((i*17)%70);
        const ground=620+Math.sin(i*0.7)*24;
        pg.fillStyle='#714827';pg.fillRect(x,ground-h,10,h);
        pg.fillStyle='#4b8d37';pg.fillRect(x-16,ground-h-34,42,24);pg.fillRect(x-10,ground-h-52,30,22);pg.fillRect(x-4,ground-h-66,18,16);
      }
      pg.fillStyle='#6e4a2f';pg.fillRect(0,690,pano.width,210);
      for(let x=0;x<pano.width;x+=40){
        pg.fillStyle=(x/40)%2===0?'#6bb34f':'#5ea645';
        pg.fillRect(x,640+Math.sin(x*0.03)*10,40,80);
      }
    }
    buildPanorama();
    let frame=0;
    function drawMenu(){
      frame++;mc.width=window.innerWidth;mc.height=window.innerHeight;
      const w=mc.width,h=mc.height;
      const zoom=1.14+Math.sin(frame*0.004)*0.015;
      const sw=Math.max(1,pano.width/zoom),sh=Math.max(1,pano.height/zoom);
      const sx=((Math.sin(frame*0.0038)*0.5)+0.5)*(pano.width-sw);
      const sy=Math.max(0,(pano.height-sh)*0.36);
      mg.imageSmoothingEnabled=false;
      mg.clearRect(0,0,w,h);
      mg.drawImage(pano,sx,sy,sw,sh,0,0,w,h);
      const vign=mg.createLinearGradient(0,0,0,h);
      vign.addColorStop(0,'rgba(5,14,24,0.08)');
      vign.addColorStop(1,'rgba(5,10,12,0.42)');
      mg.fillStyle=vign;mg.fillRect(0,0,w,h);
    }
    function menuLoop(){if(document.getElementById('main-menu').style.display!=='none')drawMenu();requestAnimationFrame(menuLoop);}
    menuLoop();
    window.addEventListener('resize',()=>{mc.width=window.innerWidth;mc.height=window.innerHeight;});
  })();

  function loadWorldDefs(){
    try{
      const parsed=JSON.parse(localStorage.getItem(WORLDS_KEY)||'[]');
      if(Array.isArray(parsed))return parsed.filter(w=>w&&w.id&&w.name).sort((a,b)=>(b.lastPlayedAt||b.createdAt||0)-(a.lastPlayedAt||a.createdAt||0));
    }catch{}
    return [];
  }
  function saveWorldDefs(nextWorlds){localStorage.setItem(WORLDS_KEY,JSON.stringify(nextWorlds||[]));}
  let worlds=loadWorldDefs();
  let selectedWorldId=null;
  let editingWorldId=null;
  let worldFormTemplate=null;
  let pendingDeleteWorldId=null;
  function selectedWorld(){return worlds.find(w=>w.id===selectedWorldId)||null;}
  function formatWorldDescription(w){
    return `Seed: ${w.seed} | Created on ${formatDateStamp(w.createdAt)} | Last played ${formatDateStamp(w.lastPlayedAt||w.createdAt)} | Version: ${w.version||'0.0.89_patch6'}`;
  }
  function setWorldActionState(btnId,enabled){
    const el=document.getElementById(btnId);
    if(!el)return;
    el.disabled=!enabled;
    el.classList.toggle('slot-disabled',!enabled);
  }
  function updateWorldSelectionActions(hasSelection=!!selectedWorld()){
    setWorldActionState('world-play',hasSelection);
    setWorldActionState('world-edit-open',hasSelection);
    setWorldActionState('world-recreate',hasSelection);
  }
  function closeWorldScreens(){
    document.getElementById('worlds-screen').style.display='none';
    document.getElementById('world-create-screen').style.display='none';
    document.getElementById('world-delete-confirm').style.display='none';
  }
  function openDeleteWorldConfirm(worldId){
    const w=worlds.find(v=>v.id===worldId);
    if(!w)return;
    pendingDeleteWorldId=w.id;
    document.getElementById('world-delete-copy').textContent=`Delete "${w.name}"? This action cannot be undone.`;
    document.getElementById('world-delete-confirm').style.display='flex';
  }
  function closeDeleteWorldConfirm(){
    pendingDeleteWorldId=null;
    document.getElementById('world-delete-confirm').style.display='none';
  }
  function openWorldList(){
    worlds=loadWorldDefs();
    const mm=document.getElementById('main-menu');
    mm.style.display='flex';
    document.getElementById('worlds-screen').style.display='flex';
    document.getElementById('world-create-screen').style.display='none';
    document.getElementById('world-delete-confirm').style.display='none';
    const q=(document.getElementById('world-search').value||'').trim().toLowerCase();
    const list=document.getElementById('world-list');
    list.innerHTML='';
    const filtered=worlds.filter(w=>w.name.toLowerCase().includes(q));
    if(filtered.length===0){
      const empty=document.createElement('div');
      empty.className='world-row world-empty';empty.textContent='No Worlds Found';
      list.appendChild(empty);
      selectedWorldId=null;
    }else{
      filtered.forEach(w=>{
        const row=document.createElement('div');
        row.className='world-row'+(w.id===selectedWorldId?' active':'');
        row.innerHTML=`<div class="world-row-icon"></div><div class="world-row-meta"><div class="world-row-name">${w.name}</div><div class="world-row-desc">${formatWorldDescription(w)}</div></div><button class="world-play-btn">▶</button>`;
        const icon=row.querySelector('.world-row-icon');
        if(icon&&w.thumb){
          icon.style.backgroundImage=`url("${w.thumb}")`;
          icon.style.backgroundSize='cover';
          icon.style.backgroundPosition='center';
          icon.style.filter='none';
        }else if(icon){
          icon.style.filter='grayscale(1)';
        }
        row.onclick=()=>{selectedWorldId=w.id;openWorldList();};
        row.querySelector('.world-play-btn')?.addEventListener('click',ev=>{ev.stopPropagation();selectedWorldId=w.id;launchSelectedWorld(false);});
        list.appendChild(row);
      });
      if(!selectedWorldId||!filtered.some(w=>w.id===selectedWorldId))selectedWorldId=filtered[0].id;
    }
    updateWorldSelectionActions(!!selectedWorldId);
  }
  function openWorldCreate(editId=null,templateWorld=null){
    editingWorldId=editId;
    worldFormTemplate=templateWorld?{...templateWorld}:null;
    const existing=worlds.find(w=>w.id===editId)||null;
    const source=existing||worldFormTemplate;
    const isEditing=!!existing;
    const isRecreate=!!(!existing&&worldFormTemplate);
    document.getElementById('world-form-title').textContent=isEditing?'Edit World':(isRecreate?'Re-Create World':'Create New World');
    document.getElementById('world-name-input').value=source?.name||'';
    document.getElementById('world-seed-input').value=source?.seed!==undefined?String(source.seed):'';
    document.getElementById('starter-chest-toggle').checked=source?!!source.starterChest:true;
    document.getElementById('developer-chest-toggle').checked=source?!!source.developerChest:false;
    const lock=!!existing;
    document.getElementById('world-seed-input').disabled=lock;
    document.getElementById('starter-chest-toggle').disabled=lock;
    document.getElementById('developer-chest-toggle').disabled=lock;
    document.getElementById('world-seed-input').classList.toggle('slot-disabled',lock);
    document.getElementById('starter-chest-toggle').parentElement?.classList.toggle('slot-disabled',lock);
    document.getElementById('developer-chest-toggle').parentElement?.classList.toggle('slot-disabled',lock);
    setWorldActionState('world-delete',isEditing);
    document.getElementById('worlds-screen').style.display='none';
    document.getElementById('world-create-screen').style.display='flex';
  }
  async function deleteWorldById(worldId){
    if(!worldId)return false;
    localStorage.removeItem(worldStateKey(worldId));
    const autosave=loadAutosaveLocal();
    if(autosave?.worldId===worldId){
      localStorage.removeItem(AUTOSAVE_KEY);
      localStorage.removeItem(LOCAL_JSON_SAVE_KEY);
    }
    await deleteWorldStateDb(worldId);
    worlds=loadWorldDefs().filter(w=>w.id!==worldId);
    saveWorldDefs(worlds);
    if(selectedWorldId===worldId)selectedWorldId=worlds[0]?.id||null;
    if(editingWorldId===worldId)editingWorldId=null;
    return true;
  }
  function saveWorldFromForm(){
    const name=(document.getElementById('world-name-input').value||'').trim()||'New World';
    const seedRaw=(document.getElementById('world-seed-input').value||'').trim();
    const seed=seedRaw===''?randomSeed():parseInt(seedRaw,10);
    const starterChest=!!document.getElementById('starter-chest-toggle').checked;
    const developerChest=!!document.getElementById('developer-chest-toggle').checked;
    if(editingWorldId){
      const w=worlds.find(v=>v.id===editingWorldId);
      if(w){w.name=name;w.seed=Number.isFinite(seed)?seed:randomSeed();w.starterChest=starterChest;w.developerChest=developerChest;w.lastPlayedAt=w.lastPlayedAt||Date.now();w.version='0.0.89_patch6';}
    }else{
      const w={id:`w_${Date.now()}_${Math.floor(Math.random()*9999)}`,name,seed:Number.isFinite(seed)?seed:randomSeed(),starterChest,developerChest,createdAt:Date.now(),lastPlayedAt:Date.now(),version:'0.0.89_patch6'};
      worlds.unshift(w);selectedWorldId=w.id;
    }
    saveWorldDefs(worlds);
    if(editingWorldId){openWorldList();return;}
    launchSelectedWorld(false);
  }
  function launchSelectedWorld(recreate=false,worldOverride=null){
    const w=worldOverride||selectedWorld();
    if(!w){openWorldCreate();return;}
    w.lastPlayedAt=Date.now();
    saveWorldDefs(worlds);
    closeWorldScreens();
    startGame({worldId:w.id,seed:w.seed,starterChest:w.starterChest!==false,developerChest:!!w.developerChest,regenerate:!!recreate});
  }
  document.getElementById('btn-singleplayer').addEventListener('click',()=>{
    worlds=loadWorldDefs();
    if(worlds.length===0){openWorldCreate();return;}
    selectedWorldId=selectedWorldId||worlds[0].id;
    openWorldList();
  });
  document.getElementById('world-search').addEventListener('input',openWorldList);
  document.getElementById('worlds-back').addEventListener('click',closeWorldScreens);
  document.getElementById('world-create-open').addEventListener('click',()=>openWorldCreate(null));
  document.getElementById('world-edit-open').addEventListener('click',()=>openWorldCreate(selectedWorldId));
  document.getElementById('world-delete').addEventListener('click',async ()=>{
    const w=worlds.find(v=>v.id===editingWorldId);
    if(!w)return;
    openDeleteWorldConfirm(w.id);
  });
  document.getElementById('world-delete-no').addEventListener('click',closeDeleteWorldConfirm);
  document.getElementById('world-delete-yes').addEventListener('click',async ()=>{
    if(!pendingDeleteWorldId)return;
    await deleteWorldById(pendingDeleteWorldId);
    closeDeleteWorldConfirm();
    openWorldList();
  });
  document.getElementById('world-create-cancel').addEventListener('click',()=>{
    worlds=loadWorldDefs();
    editingWorldId=null;
    worldFormTemplate=null;
    if(worlds.length===0){
      closeWorldScreens();
      document.getElementById('main-menu').style.display='flex';
      return;
    }
    openWorldList();
  });
  document.getElementById('world-save-create').addEventListener('click',saveWorldFromForm);
  document.getElementById('world-play').addEventListener('click',()=>launchSelectedWorld(false));
  document.getElementById('world-recreate').addEventListener('click',()=>{
    const w=selectedWorld();
    if(!w)return;
    openWorldCreate(null,{name:w.name,seed:w.seed,starterChest:w.starterChest!==false,developerChest:!!w.developerChest,sourceWorldId:w.id});
  });
  document.getElementById('btn-options').addEventListener('click',openSettingsFromMenu);
  document.getElementById('btn-quit').addEventListener('click',()=>{document.getElementById('quit-confirm').style.display='flex';});
  document.getElementById('quit-confirm-no').addEventListener('click',()=>{document.getElementById('quit-confirm').style.display='none';});
  document.getElementById('quit-confirm-yes').addEventListener('click',()=>window.close());
  window.addEventListener('beforeunload',()=>saveGameLocal());
   
   // ═══════════════════════════════════════════════════════════
   // 23. RESIZE
   // ═══════════════════════════════════════════════════════════
   window.addEventListener('resize',()=>{
     camera.aspect=window.innerWidth/window.innerHeight;
     camera.updateProjectionMatrix();
     renderer.setSize(window.innerWidth,window.innerHeight);
   });
