import { useState } from 'react';
import MathText from '../../components/MathText';
import UT4InteractiveLesson from './UT4InteractiveLesson';
import { reviewLevel, visualSteps } from './ut4ConceptSupport';
import all from './ut4/assets/conditional-all.png';
import given from './ut4/assets/conditional-given.png';
import notation from './ut4/assets/conditional-notation.png';
import a from './ut4/assets/venn-1.png';
import b from './ut4/assets/venn-2.png';
import intersection from './ut4/assets/venn-3.png';
import sum from './ut4/assets/venn-4.png';
import subtract from './ut4/assets/venn-5.png';
import union from './ut4/assets/venn-6.png';
import neither from './ut4/assets/venn-7.png';
import complement from './ut4/assets/venn-9.png';
import './UT4ConceptLesson.css';

const images: Record<string, string> = { 'conditional-all.png': all, 'conditional-given.png': given, 'conditional-notation.png': notation,
  'venn-1.png': a, 'venn-2.png': b, 'venn-3.png': intersection, 'venn-4.png': sum, 'venn-5.png': subtract, 'venn-6.png': union, 'venn-7.png': neither, 'venn-9.png': complement };

export default function UT4ConceptLesson({ count, onReviewAgain, ...props }: {
  nodeId: string; count: number; disabled: boolean; onComplete: () => void; onSkip?: () => void; confirmLabel: string; onReviewAgain: () => void;
}) {
  const [step, setStep] = useState(0);
  const steps = visualSteps(props.nodeId, count);
  const page = steps[step];
  return <div className="ut4-concept-support" data-review-level={reviewLevel(props.nodeId, count)}>
    <div className="ut4-review-toolbar"><span>{count ? `개념 확인 ${count}번째` : '첫 개념 학습'}</span><button type="button" disabled={props.disabled} onClick={onReviewAgain}>개념 다시 확인하기 · 더 자세히 →</button></div>
    {!page ? <UT4InteractiveLesson {...props} /> : <section className="ut4-visual-lesson" aria-label="그림으로 개념 확인">
      <div className="ut4-visual-step"><span>그림으로 이해하기 · {step + 1} / {steps.length}</span>{props.onSkip && <button type="button" disabled={props.disabled} onClick={props.onSkip}>풀던 문제로 돌아가기 →</button>}</div>
      <h3 tabIndex={-1} ref={node => { if (node) node.focus({ preventScroll: true }); }}>{page.title}</h3>
      <p>{page.text}</p>
      <div className={page.images.length > 1 ? 'ut4-diagram-grid' : 'ut4-diagram-single'}>{page.images.map(image => <figure key={image.file}><img src={images[image.file]} alt={image.alt} /><figcaption>{image.alt}</figcaption></figure>)}</div>
      <div className="ut4-visual-formula"><MathText text={page.formula} /></div>
      <footer><button type="button" disabled={props.disabled || step === 0} onClick={() => setStep(i => i - 1)}>← 이전 설명</button><button type="button" disabled={props.disabled} onClick={step < steps.length - 1 ? () => setStep(i => i + 1) : props.onComplete}>{step < steps.length - 1 ? '다음 설명 →' : props.confirmLabel}</button></footer>
    </section>}
  </div>;
}
