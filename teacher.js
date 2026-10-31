'use strict';
const gate=document.getElementById('gate'),content=document.getElementById('teacherContent');
gate.onsubmit=e=>{e.preventDefault();if(document.getElementById('pin').value!=='1031'){document.getElementById('gateFeedback').textContent='입장 코드가 다릅니다. 교사용 안내서를 확인하세요.';return}gate.hidden=true;content.hidden=false;document.getElementById('pin').value=''};
document.getElementById('logout').onclick=()=>{content.hidden=true;gate.hidden=false;document.getElementById('gateFeedback').textContent='';window.scrollTo(0,0)};
document.getElementById('resetPractice').onclick=()=>{
 const out=document.getElementById('resetFeedback'),i=+document.getElementById('resetRoom').value;
 try{const key='artisan-seals-practice-v1',s=JSON.parse(localStorage.getItem(key)||'null');if(!s){out.textContent='저장된 연습 기록이 없습니다. 먼저 연습 게임을 시작하세요.';return}
 s.done[i]=false;s.seen[i]=[];s.hints[i]=0;s.escaped=false;s.room=i;
 if(i===0)s.paper={p:[{x:70,y:85,moved:false},{x:465,y:65,moved:false}],aligned:false};
 if(i===1)s.knot={p:[{x:115,y:130,moved:false},{x:600,y:225,moved:false}],cross:[false,false,false,false]};
 if(i===2)s.clay={order:[2,0,3,1],moved:false,ordered:false,fills:Array(6).fill(null),soil:'white'};
 if(i===3)s.shell={p:Array.from({length:6},(_,j)=>({x:80+(j%2)*75,y:65+Math.floor(j/2)*110,a:90+(j*60)%360,moved:false,placed:false})),selected:0};
 localStorage.setItem(key,JSON.stringify(s));out.textContent=['종이','실','흙','빛'][i]+'의 방 연습 기록을 초기화했습니다. 연습 탭을 다시 열고 이어 하세요.'
 }catch(_){out.textContent='저장 공간에 접근할 수 없습니다. 같은 주소의 일반 브라우저 창에서 다시 시도하세요.'}
};
