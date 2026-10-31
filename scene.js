/* Local, procedural Three.js environments. No network assets or model downloads. */
(function(){
'use strict';
class CraftWorld {
  constructor(canvas,onFrame){
    this.canvas=canvas;this.onFrame=onFrame;this.yaw=0;this.pitch=-.035;this.drag=null;this.room=0;this.active=true;this.glows=[];
    if(!window.THREE)throw Error('Three.js 리소스를 읽지 못했습니다. vendor 폴더를 확인하세요.');
    this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.7));this.renderer.outputEncoding=THREE.sRGBEncoding;
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.15;
    this.camera=new THREE.PerspectiveCamera(65,1,.08,45);this.camera.rotation.order='YXZ';this.camera.position.set(0,1.85,3.2);
    this.resize=()=>{this.renderer.setSize(innerWidth,innerHeight,false);this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix()};
    addEventListener('resize',this.resize);this.resize();this.setupInput();this.build(0);
    this.animate=this.animate.bind(this);requestAnimationFrame(this.animate);
  }
  texture(type){
    const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');let s=3784;
    const random=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296};
    x.fillStyle=type==='wood'?'#715137':'#aa9d7d';x.fillRect(0,0,256,256);
    for(let i=0;i<1800;i++){x.strokeStyle=type==='wood'?`rgba(${random()>.5?'30,14,7':'210,169,108'},${random()*.13})`:`rgba(63,54,32,${random()*.12})`;x.lineWidth=random()*2+.3;x.beginPath();const a=random()*256,b=random()*256;x.moveTo(a,b);x.lineTo(type==='wood'?a+random()*150:a+random()*10,b+random()*3);x.stroke()}
    const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(type==='wood'?2:3,type==='wood'?2:3);t.encoding=THREE.sRGBEncoding;return t;
  }
  mat(color,roughness=.8,metalness=0){return new THREE.MeshStandardMaterial({color:new THREE.Color(color).convertSRGBToLinear(),roughness,metalness})}
  box(x,y,z,w,h,d,mat,parent=this.scene){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);parent.add(m);return m}
  cylinder(x,y,z,r,h,mat,r2=r,parent=this.scene){const m=new THREE.Mesh(new THREE.CylinderGeometry(r2,r,h,40),mat);m.position.set(x,y,z);parent.add(m);return m}
  tube(points,r,mat,parent=this.scene,closed=false){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),closed);const m=new THREE.Mesh(new THREE.TubeGeometry(curve,100,r,8,closed),mat);parent.add(m);return m}
  textLabel(text,x,y,z){const c=document.createElement('canvas');c.width=512;c.height=100;const a=c.getContext('2d');a.fillStyle='#d9c9a4';a.fillRect(0,0,512,100);a.fillStyle='#3b392c';a.font='32px Malgun Gothic';a.textAlign='center';a.fillText(text,256,61);const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;const m=new THREE.Mesh(new THREE.PlaneGeometry(2,.39),new THREE.MeshBasicMaterial({map:t}));m.position.set(x,y,z);this.scene.add(m);return m}
  build(room){
    if(this.scene){const textures=new Set();this.scene.traverse(o=>{o.geometry?.dispose();if(o.material){const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>{if(m.map)textures.add(m.map);m.dispose()})}});textures.forEach(t=>t.dispose())}
    this.room=room;this.renderer.toneMappingExposure=room===3?.8:1.05;this.glows=[];this.scene=new THREE.Scene();const theme=[['#544735','#cf9c54','#f3cb85'],['#393735','#c58e4c','#f1d6a1'],['#274b49','#68b6aa','#b8e6d0'],['#16212b','#b6a0cd','#a0c9c7']][room];
    this.scene.background=new THREE.Color(theme[0]);this.scene.fog=new THREE.FogExp2(theme[0],.025);
    this.scene.add(new THREE.HemisphereLight(room===3?0x9cabbf:0xe9e6cf,0x312b21,room===3?.42:1.0));
    const light=new THREE.PointLight(theme[2],1.5,24,1.5);light.position.set(-3,3.8,-2);this.scene.add(light);
    const side=new THREE.PointLight(room===2?0x83d7ca:room===3?0x8bc1c9:0xffba65,1.1,20);side.position.set(4,2.9,-4);this.scene.add(side);
    const wood=this.mat('#6f4931');wood.map=this.texture('wood');const darkwood=this.mat('#342820');const wall=this.mat(theme[0]);wall.map=this.texture('paper');
    this.box(0,0,0,14,.2,14,darkwood);
    for(let i=0;i<14;i++){this.box(i-6.5,.12,0,.97,.08,14,wood)}
    this.box(0,2.7,-6.2,14,5.4,.2,wall);this.box(0,2.7,6.2,14,5.4,.2,wall);this.box(-6.7,2.7,0,.2,5.4,12.5,wall);this.box(6.7,2.7,0,.2,5.4,12.5,wall);this.box(0,5.3,0,14,.15,14,darkwood);
    for(let j=-6;j<=6;j+=3){this.box(j,2.7,-6, .16,5.4,.28,darkwood);this.box(j,2.7,6,.16,5.4,.28,darkwood);this.box(j,5.1,0,.19,.26,12.5,wood)}
    for(const z of [-6,0,6]){this.box(0,4.7,z,13.5,.25,.25,wood);this.box(-6.5,2.7,z,.24,5.4,.24,wood);this.box(6.5,2.7,z,.24,5.4,.24,wood)}
    const paper=new THREE.MeshStandardMaterial({color:room===3?'#10202d':'#eddaaa',emissive:room===3?'#0b1824':'#9f783a',emissiveIntensity:room===3?.18:.6,roughness:1});
    for(const x of [-3.7,0,3.7]){this.box(x,3.1,-6.03,2.9,2.85,.06,paper);for(let q=-1.2;q<=1.3;q+=.4){this.box(x+q,3.1,-5.98,.025,2.85,.04,wood)}for(let q=-1.2;q<=1.3;q+=.4){this.box(x,3.1+q,-5.95,2.9,.028,.06,wood)}this.box(x,1.65,-5.94,3.12,.1,.1,darkwood);this.box(x,4.55,-5.94,3.12,.12,.1,darkwood)}
    // Table and shelves surround the fixed observer: all four walls remain explorable.
    this.box(0,1.05,-2.7,5.4,.16,2.3,wood);for(const x of [-2.35,2.35])for(const z of [-3.65,-1.75])this.box(x,.55,z,.16,1.05,.16,darkwood);
    for(const x of [-5.4,5.4]){for(const y of [.5,1.7,2.9])this.box(x,y,-3,1.4,.1,3.1,wood);for(const z of [-4.3,-1.7])this.box(x,1.7,z,.1,3.5,.12,darkwood)}
    this.box(0,1.3,5.92,5,.1,.6,wood);this.textLabel(['빛을 품은 섬유','인연을 잇는 선','흙으로 새기는 기억','어둠에 놓는 빛'][room],0,3.1,5.93).rotation.y=Math.PI;
    // A letter, a material collection, and a tool each have their own spatial clue.
    const envelope=this.box(-1.7,1.17,-2.1,.8,.035,.55,this.mat('#e8d6a4'));envelope.rotation.y=-.18;this.cylinder(-1.7,1.20,-2.1,.09,.012,this.mat('#9f4334'));
    this.anchors=[new THREE.Vector3(-1.7,1.55,-2.1),new THREE.Vector3(1.6,1.8,-3),new THREE.Vector3(5.25,1.9,-.7)];
    const lampmat=new THREE.MeshStandardMaterial({color:room===3?'#7896a4':'#ead6a2',emissive:room===3?'#183543':'#da9b3f',emissiveIntensity:room===3?.28:1.0,roughness:1});
    for(const x of [-3.4,3.4]){this.cylinder(x,3.6,-3.2,.43,1.1,lampmat);this.cylinder(x,4.25,-3.2,.47,.07,wood);this.cylinder(x,2.98,-3.2,.47,.07,wood);this.box(x,4.75,-3.2,.022,1,.022,darkwood);for(let j=0;j<10;j++){const a=j/10*Math.PI*2;this.box(x+Math.sin(a)*.435,3.6,-3.2+Math.cos(a)*.435,.018,1.1,.018,darkwood)}}
    if(room===0){
      const screen=this.box(.3,1.25,-2.75,2.15,.06,1.2,darkwood);this.box(.3,1.30,-2.75,1.95,.022,1.05,this.mat('#dcd1a7'));
      for(let n=0;n<24;n++)this.box(-.62+n*.08,1.32,-2.75,.014,.012,1.04,wood);
      for(let n=0;n<6;n++){const stem=this.cylinder(1.55+n*.07,1.35,-2.9,.025,.62,this.mat('#b69b69'));stem.rotation.z=.8;stem.rotation.x=.2}
      for(let n=0;n<5;n++)this.box(-5.4,.6+n*.07,-2.4,1.05,.045,.75,this.mat('#e8dbaf'));
      this.box(5.15,1.2,-.7,1.6,.14,1.6,wood);this.box(5.15,1.35,-.7,1.3,.1,1.3,this.mat('#c3b177'));for(let n=0;n<14;n++)this.box(4.57+n*.09,1.42,-.7,.022,.03,1.3,wood);
      this.textLabel('닥나무 · 섬유 · 발',0,4.9,-5.86);
    }else if(room===1){
      const colors=['#be463f','#c29d48','#3e7b90','#ddd0a2','#34363b'];for(let i=0;i<5;i++){const cord=this.mat(colors[i],.6);this.cylinder(1.15+i*.23,1.38,-3.0,.12,.45,cord);this.cylinder(1.15+i*.23,1.65,-3.0,.15,.04,wood)}
      const knot=(x,y,z,scale,color)=>{const g=new THREE.Group();g.position.set(x,y,z);g.scale.setScalar(scale);this.scene.add(g);const m=this.mat(color,.45);for(let j=0;j<4;j++){const a=j*Math.PI/2;const p=[];for(let k=0;k<18;k++){const t=k/17*Math.PI*2;p.push([Math.sin(a)*.4+Math.cos(t)*.28,Math.cos(a)*.4+Math.sin(t)*.28,Math.sin(t*2)*.065])}this.tube(p,.048,m,g,true)}this.tube([[-.3,0,.1],[0,.3,0],[.3,0,.1],[0,-.3,0],[-.3,0,.1]],.045,m,g);return g};
      knot(0,2.95,-5.8,1.25,'#c2413e');knot(-4.8,2.8,-3.3,.7,'#ce9a3f');
      // Ring knot reference: a small woven torus around a central cord, rather than a figure eight.
      const ring=new THREE.Mesh(new THREE.TorusGeometry(.16,.07,10,32),this.mat('#ab3234'));ring.position.set(0,2,-5.65);this.scene.add(ring);
      for(let n=0;n<24;n++)this.tube([[Math.sin(n)*.05,1.86,-5.65],[Math.sin(n)*.25,1.2,-5.65],[Math.sin(n)*.25,.9,-5.65]],.012,this.mat('#c89d4b'));
      this.box(5.15,1.15,-.7,1.4,.12,1.4,wood);knot(5.15,1.75,-.7,.6,'#41858a');this.textLabel('국화매듭과 노리개',0,4.9,-5.86);
    }else if(room===2){
      this.vase(0,1.15,-2.9,1.05);this.vase(-5.4,1.78,-2.5,.52);this.vase(5.4,1.78,-3.3,.65);this.vase(-5.4,3,-3.8,.38);
      const white=this.mat('#e1dbc7'),black=this.mat('#383632');this.cylinder(1.55,1.19,-2.0,.29,.1,white);this.cylinder(2.15,1.19,-2.0,.29,.1,black);
      this.cylinder(5.25,1.15,-.7,.9,.2,wood);this.cylinder(5.25,1.29,-.7,.65,.08,this.mat('#748d77'));this.tube([[4.6,1.4,-.7],[5,1.45,-.7],[5.3,1.5,-.7]],.025,this.mat('#e5c08b'));this.textLabel('고려 상감청자',0,4.9,-5.86);
    }else{
      const lacquer=this.mat('#0c1016',.17,.25);const g=new THREE.Group();g.position.set(.2,1.16,-2.8);this.scene.add(g);this.box(0,.27,0,2.6,.55,1.55,lacquer,g);this.box(0,.59,0,2.7,.08,1.65,lacquer,g);this.box(0,.3,.79,.21,.17,.035,this.mat('#a28c59',.3,.8),g);
      for(let j=0;j<6;j++){const a=j*Math.PI/3;const front=this.shell();front.rotation.z=a;front.scale.setScalar(.24);front.position.set(0,.28,.805);g.add(front);const shell=this.shell();shell.rotation.x=-Math.PI/2;shell.rotation.z=-a;shell.position.set(Math.sin(a)*.3,.64,Math.cos(a)*.3);shell.scale.set(.65,.65,.65);g.add(shell)}
      const cabinet=this.box(-5.4,1.55,-2.6,1.2,2.5,1.2,lacquer);for(let k=0;k<4;k++)this.box(-5.4,.65+k*.6,-1.98,1.08,.025,.02,wood);
      for(let k=0;k<12;k++){const s=this.shell();s.position.set(1.3+(k%4)*.2,1.18,-2.6+Math.floor(k/4)*.18);s.rotation.x=-Math.PI/2;s.rotation.z=k;s.scale.setScalar(.16);this.scene.add(s)}
      this.box(5.15,1.2,-.7,1.6,.12,1.4,lacquer);this.textLabel('옻 위에 피어나는 빛',0,4.9,-5.86);
    }
    // Fine particles are static spatial points; low cost on tablets.
    const pos=[];for(let i=0;i<100;i++)pos.push(Math.sin(i*7)*6,(i%31)/7+.4,Math.cos(i*13)*6);
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));this.scene.add(new THREE.Points(geo,new THREE.PointsMaterial({color:theme[2],size:.017,transparent:true,opacity:.45})));
  }
  vase(x,y,z,size){
    const profile=[[.0,.0],[.36,.03],[.32,.16],[.28,.35],[.4,.75],[.53,1.12],[.50,1.42],[.34,1.63],[.15,1.75],[.13,1.93],[.2,1.98],[.2,2.04],[.12,2.04]];
    const g=new THREE.Group();g.position.set(x,y,z);g.scale.setScalar(size);this.scene.add(g);
    const m=this.mat('#76a99a',.27,.12);const mesh=new THREE.Mesh(new THREE.LatheGeometry(profile.map(p=>new THREE.Vector2(...p)),60),m);g.add(mesh);
    for(let k=0;k<3;k++){const ring=new THREE.Mesh(new THREE.TorusGeometry(.51-k*.022,.006,4,60),this.mat('#d6d5b5'));ring.rotation.x=Math.PI/2;ring.position.y=1.1+k*.11;g.add(ring)}
    for(let k=0;k<8;k++){const a=k/8*Math.PI*2;const flower=this.shell();flower.position.set(Math.sin(a)*.48,.86,Math.cos(a)*.48);flower.rotation.y=a;flower.scale.set(.13,.13,.13);g.add(flower)}return g;
  }
  shell(){const shape=new THREE.Shape();shape.moveTo(0,0);shape.bezierCurveTo(-.3,.3,-.25,.78,0,1);shape.bezierCurveTo(.25,.78,.3,.3,0,0);const mat=new THREE.MeshStandardMaterial({color:'#c9ded3',emissive:'#244650',emissiveIntensity:.2,metalness:.55,roughness:.17,side:THREE.DoubleSide});const mesh=new THREE.Mesh(new THREE.ShapeGeometry(shape,20),mat);this.glows.push(mat);return mesh}
  setupInput(){
    const c=this.canvas;
    c.addEventListener('pointerdown',e=>{if(this.drag)return;this.drag={id:e.pointerId,x:e.clientX,y:e.clientY};try{c.setPointerCapture(e.pointerId)}catch(_){}c.classList.add('dragging')});
    c.addEventListener('pointermove',e=>{if(!this.drag||this.drag.id!==e.pointerId)return;this.yaw+=(e.clientX-this.drag.x)*.005;this.pitch+=(e.clientY-this.drag.y)*.004;this.pitch=Math.max(-1.05,Math.min(1.05,this.pitch));this.drag.x=e.clientX;this.drag.y=e.clientY});
    const end=e=>{if(this.drag?.id===e.pointerId){this.drag=null;c.classList.remove('dragging')}};c.addEventListener('pointerup',end);c.addEventListener('pointercancel',end);c.addEventListener('lostpointercapture',end);
    c.addEventListener('keydown',e=>{if(e.key.startsWith('Arrow')){e.preventDefault();if(e.key==='ArrowLeft')this.yaw+=.14;if(e.key==='ArrowRight')this.yaw-=.14;if(e.key==='ArrowUp')this.pitch=Math.min(1.05,this.pitch+.1);if(e.key==='ArrowDown')this.pitch=Math.max(-1.05,this.pitch-.1)}});
  }
  project(v){const p=v.clone().project(this.camera);const local=v.clone().sub(this.camera.position).applyQuaternion(this.camera.quaternion.clone().invert());return {x:(p.x+1)*innerWidth/2,y:(1-p.y)*innerHeight/2,visible:local.z<0&&p.x>-.92&&p.x<.92&&p.y>-.75&&p.y<.75}}
  animate(t){if(!document.hidden){this.camera.rotation.set(this.pitch,this.yaw,0);this.glows.forEach((m,i)=>m.color.setHSL(.48+Math.sin(t*.0005+i)*.12,.21,.68));this.renderer.render(this.scene,this.camera);this.onFrame?.(this)}requestAnimationFrame(this.animate)}
}
window.CraftWorld=CraftWorld;
})();
