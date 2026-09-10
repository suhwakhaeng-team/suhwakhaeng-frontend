import { useId } from 'react';
import ProblemContent from './ProblemContent';
import { parseQuestionChoices } from '../lib/questionChoices';

interface Props {
  content: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function QuestionPrompt({ content, value, onChange, disabled = false }: Props) {
  const name = useId();
  const question = parseQuestionChoices(content);
  if (!question) return <ProblemContent content={content} />;
  return <>
    <ProblemContent content={question.stem} />
    <fieldset disabled={disabled} style={{ border: 0, padding: 0, margin: '20px 0 0', minWidth: 0 }}>
      <legend style={{ fontSize: 14, marginBottom: 10 }}>정답을 하나 선택하세요</legend>
      <div style={{ display: 'grid', gap: 10 }}>
        {question.choices.map(choice => <label key={choice.value} style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
          border: `2px solid ${value === choice.value ? '#2563eb' : '#e5e7eb'}`,
          borderRadius: 12, background: value === choice.value ? '#eff6ff' : '#fff',
          cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.65 : 1,
        }}>
          <input type="radio" name={name} value={choice.value} checked={value === choice.value}
            onChange={() => onChange(choice.value)} aria-label={`${choice.value}번`} style={{ accentColor: '#2563eb', flexShrink: 0 }} />
          <span aria-hidden="true">{choice.label}</span>
          <div style={{ minWidth: 0, flex: 1 }}><ProblemContent content={choice.content} /></div>
        </label>)}
      </div>
    </fieldset>
  </>;
}
