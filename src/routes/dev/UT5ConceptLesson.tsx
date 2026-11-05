import UT4ConceptLesson from './UT4ConceptLesson';
import UT5InteractiveLesson from './UT5InteractiveLesson';
export default function UT5ConceptLesson({count,onReviewAgain,...props}:{nodeId:string;goalId?:string;count:number;disabled:boolean;onComplete:()=>void;onSkip?:()=>void;confirmLabel:string;onReviewAgain:()=>void}) {
if (props.nodeId === 'topic-2' && count >= 2) return <UT4ConceptLesson {...props} nodeId="c-conditional" count={count} onReviewAgain={onReviewAgain}/>;
return <div className="ut4-concept-support"><div className="ut4-review-toolbar"><span>{count ? `개념 확인 ${count}번째` : '첫 개념 학습'}</span><button type="button" disabled={props.disabled} onClick={onReviewAgain}>개념 다시 확인하기 · 더 자세히 →</button></div><UT5InteractiveLesson {...props}/></div>;
}
