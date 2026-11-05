import { useState } from 'react';
import ProblemQuestionCard from '../../components/ProblemQuestionCard';
import ProblemContent from '../../components/ProblemContent';
import UT5ConceptLesson from './UT5ConceptLesson';
import { UT5_NODES, parseProbabilityAnswer } from './ut5Model';
import { UT5_TARGET_CHOICES } from './ut5TargetChoices';
import { UT5_LEARNING_SUPPORT } from './ut5LearningSupport';
import { UT5_HINTS } from './ut5Hints';

export default function UT5NodeReview({nodeId,onBack,onOpen}:{nodeId:string;onBack:()=>void;onOpen:(id:string)=>void}) {
 const node=UT5_NODES[nodeId],question=node.questions[0],choices=UT5_TARGET_CHOICES[nodeId];
 const [count,setCount]=useState(0),[answer,setAnswer]=useState(''),[checked,setChecked]=useState(false),[solution,setSolution]=useState(false);
 const entered=choices?choices[Number(answer)-1]?.value:answer;
 const value=parseProbabilityAnswer(entered||''),expected=parseProbabilityAnswer(question.answer);
 const correct=checked&&value!==null&&expected!==null&&Math.abs(value-expected)<.000001;
 return <section className="plm-live-solver" style={{maxWidth:760,margin:'0 auto'}}>
   <button type="button" className="ut-new-session-button" onClick={onBack}>← 문제 지도로 돌아가기</button>
   <h2>{node.label}</h2><p className="plm-live-muted">복습 화면이에요. 다시 풀어도 시험 점수와 풀이 시간은 바뀌지 않아요.</p>
   {node.kind==='concept'?<UT5ConceptLesson key={count} nodeId={nodeId} count={count} disabled={false} onReviewAgain={()=>setCount(c=>c+1)} onComplete={onBack} confirmLabel="복습 마치고 지도로 돌아가기 →"/>:<>
     <ProblemQuestionCard problem={{description:question.prompt.replace('값을 분수 또는 소수로 구하세요.','')+(choices?'\n\n'+choices.map((c,i)=>`${'①②③④⑤'[i]} ${c.label}`).join('\n'):''),answerType:'NUMBER'}} value={answer} onChange={v=>{setAnswer(v);setChecked(false);setSolution(false);}}/>
     <form onSubmit={e=>{e.preventDefault();setChecked(true);}}>{!choices&&<label className="plm-number-answer">답안<input aria-label="복습 답안" value={answer} onChange={e=>{setAnswer(e.target.value);setChecked(false);setSolution(false);}} placeholder="분수 또는 소수"/></label>}<div className="plm-live-actions"><button type="button" className="ut-new-session-button" onClick={()=>setSolution(v=>!v)}>{solution?'풀이 닫기':'풀이 보기'}</button><button className="ut-new-session-button" disabled={value===null}>답 확인</button></div></form>
     {checked&&<div className="plm-live-feedback ut-feedback" role="status"><strong>{correct?'정답이에요':'한 번 더 확인해 보세요'}</strong>{!correct&&<p>{UT5_HINTS[nodeId]}</p>}</div>}
     {(solution||correct)&&<div className="ut4-learning-help is-expanded"><ProblemContent content={question.explanation}/></div>}
     <div className="ut4-learning-help"><h3>필요한 개념 다시 보기</h3><div className="ut4-concept-links">{UT5_LEARNING_SUPPORT[nodeId].concepts.map(id=><button key={id} type="button" onClick={()=>onOpen(id)}>{UT5_NODES[id].label} →</button>)}</div></div>
   </>}
 </section>;
}
