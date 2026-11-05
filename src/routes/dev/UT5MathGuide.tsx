import MathText from '../../components/MathText';
import './UT5MathGuide.css';

type Term = {symbol:string;name:string;description:string};
export function ut5MathTerms(formula:string):Term[] {
 const terms:Term[]=[];
 const add=(symbol:string,name:string,description:string)=>terms.push({symbol,name,description});
 const trials=/C_|C\{|C\s|p\^|p\(/.test(formula);
 if(/\\sigma\s*\(\\overline/.test(formula)) add('$\\sigma(\\overline X)$','표본평균의 표준편차','같은 개수씩 여러 번 뽑아 평균을 낼 때, 그 평균들이 얼마나 흩어지는지 나타내요.');
 else if(/\\sigma/.test(formula)) add('$\\sigma$','모표준편차 · 시그마','조사하려는 전체 자료가 평균 주변에 얼마나 흩어져 있는지 나타내요.');
 if(/\\overline/.test(formula)) add('$\\overline X$','표본평균 · 엑스 바','뽑은 값들을 모두 더한 뒤, 뽑은 개수로 나눈 평균이에요.');
 if(/\\mu/.test(formula)) add('$\\mu$','모평균 · 뮤','조사하려는 전체 자료의 평균이에요.');
 if(/(^|[^a-zA-Z])n([^a-zA-Z]|$)/.test(formula)) add('$n$',trials?'시행 횟수':'표본의 크기',trials?'같은 실험을 반복하는 횟수예요.':'전체에서 뽑은 자료의 개수예요.');
 if(/\\sqrt/.test(formula)) add('$\\sqrt{n}$','제곱근 · 루트','같은 수를 두 번 곱해서 원래 수가 되는 값을 찾아요. 예: 4×4=16이므로 √16=4예요.');
 if(/(^|[^a-zA-Z])z([^a-zA-Z]|$)/.test(formula)) add('$z$','신뢰수준에 따른 임계값','원하는 신뢰도에 맞춰 쓰는 기준 숫자예요. 이 검사에서는 95%에 1.96, 99%에 2.58을 써요.');
 if(/Z/.test(formula)) add('$Z$','표준화한 확률변수','평균에서 떨어진 거리를 표준편차 단위로 바꾼 값이에요. 음수는 평균 왼쪽, 양수는 오른쪽이에요.');
 if(/p/.test(formula) && !/\\cap|\\cup|\\sigma/.test(formula)) add('$p$','한 번의 성공 확률','실험을 한 번 했을 때 성공할 확률이에요. 실패할 확률은 1−p예요.');
 if(/C_/.test(formula)) add('${}_nC_k$','조합의 수 · 엔 씨 케이','전체 n번 중에서 성공할 k번의 자리를 고르는 방법의 수예요.');
 if(/P\(/.test(formula)) add('$P(A)$','사건 A의 확률','A라고 정한 일이 일어날 가능성이에요. 예를 들어 A를 ‘모자를 쓴 사람을 뽑는 일’로 정할 수 있어요.');
 if(/\^c/.test(formula)) add('$A^c$','여사건','A가 일어나지 않는 경우를 모은 것이에요.');
 if(/\\cap/.test(formula)) add('$A\\cap B$','교집합','A와 B 두 가지에 모두 해당하는 부분이에요.');
 if(/\\cup/.test(formula)) add('$A\\cup B$','합집합','A 또는 B 중 하나 이상에 해당하는 부분이에요. 두 가지 모두에 해당하는 부분도 포함해요.');
 if(/\\mid/.test(formula)) add('$P(A\\mid B)$','조건부확률','이미 B에 해당한다고 정해진 대상 중에서, A에도 해당하는 비율이에요.');
 if(/\\ge/.test(formula)) add('$\\ge$','이상 · 크거나 같다','오른쪽 값보다 크거나 같은 경우예요. 같은 값도 포함해요.');
 if(/\\le/.test(formula)) add('$\\le$','이하 · 작거나 같다','오른쪽 값보다 작거나 같은 경우예요. 같은 값도 포함해요.');
 return terms;
}
export default function UT5MathGuide({formula}:{formula:string}) {
 const terms=ut5MathTerms(formula);
 if(!terms.length)return null;
 return <aside className="ut5-math-guide" aria-label="식에 나온 기호 설명"><h4>기호와 뜻</h4><dl>{terms.map(t=><div className="ut5-math-term" key={t.symbol}><dt><span className="ut5-math-symbol"><MathText text={t.symbol}/></span><strong>{t.name}</strong></dt><dd>{t.description}</dd></div>)}</dl></aside>;
}
