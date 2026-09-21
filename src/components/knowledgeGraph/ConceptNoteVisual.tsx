export default function ConceptNoteVisual({ conceptName }: { conceptName: string }) {
  switch (conceptName) {
    case '평균':
      return <figure className="kg-note-visual kg-note-average">
        <figcaption>서로 다른 양을 공평하게 나누면 평균이 보여요.</figcaption>
        <div className="kg-average-before">
          {[2, 4, 9].map((count, index) => <div key={count}><span>{['철수', '영희', '민수'][index]}</span><i style={{ height: 10 + count * 8 }} /><b>{count}</b></div>)}
        </div>
        <div className="kg-visual-arrow">골고루 나누기 ↓</div>
        <div className="kg-average-after">
          {[0, 1, 2].map(index => <div key={index}><span>{['철수', '영희', '민수'][index]}</span><i /><b>5</b></div>)}
        </div>
      </figure>;

    case '최빈값':
      return <figure className="kg-note-visual kg-note-mode">
        <figcaption>가장 높이 쌓인 값이 가장 자주 나온 값이에요.</figcaption>
        <div>
          {[{ value: 240, count: 1 }, { value: 245, count: 3 }, { value: 250, count: 1 }].map(item => <div key={item.value}>
            <span>{Array.from({ length: item.count }, (_, index) => <i key={index} />)}</span>
            <b>{item.value}</b>
            {item.value === 245 && <em>최빈값</em>}
          </div>)}
        </div>
      </figure>;

    case '도수분포표':
      return <figure className="kg-note-visual kg-note-frequency-table">
        <figcaption>자료를 구간별 상자에 넣고 개수만 세면 돼요.</figcaption>
        <table>
          <thead><tr><th>점수 구간</th><th>들어가는 자료</th><th>도수</th></tr></thead>
          <tbody>
            <tr><td>0~9점</td><td>3, 7</td><td><b>2명</b></td></tr>
            <tr><td>10~19점</td><td>12, 15, 18</td><td><b>3명</b></td></tr>
          </tbody>
        </table>
      </figure>;

    case '히스토그램':
      return <figure className="kg-note-visual">
        <figcaption>막대가 높을수록 그 구간에 자료가 많아요.</figcaption>
        <svg className="kg-note-chart" viewBox="0 0 420 210" role="img" aria-label="도수가 2, 5, 3인 히스토그램">
          <line x1="54" y1="16" x2="54" y2="169" /><line x1="54" y1="169" x2="390" y2="169" />
          {[1, 2, 3, 4, 5].map(tick => <g key={tick}><line className="grid" x1="54" y1={169 - tick * 27} x2="390" y2={169 - tick * 27} /><text x="39" y={174 - tick * 27}>{tick}</text></g>)}
          <rect x="80" y="115" width="92" height="54" /><rect className="highlight" x="172" y="34" width="92" height="135" /><rect x="264" y="88" width="92" height="81" />
          <text x="126" y="191">0~9</text><text x="218" y="191">10~19</text><text x="310" y="191">20~29</text>
          <text className="axis-label" x="14" y="22">도수</text><text className="axis-label" x="365" y="205">점수</text>
        </svg>
      </figure>;

    case '도수분포다각형':
      return <figure className="kg-note-visual">
        <figcaption>각 구간의 가운데에 점을 찍고 선으로 연결해요.</figcaption>
        <svg className="kg-note-chart" viewBox="0 0 420 210" role="img" aria-label="계급값과 도수를 연결한 도수분포다각형">
          <line x1="48" y1="18" x2="48" y2="169" /><line x1="48" y1="169" x2="392" y2="169" />
          {[1, 2, 3, 4, 5].map(tick => <g key={tick}><line className="grid" x1="48" y1={169 - tick * 27} x2="392" y2={169 - tick * 27} /><text x="33" y={174 - tick * 27}>{tick}</text></g>)}
          <polyline className="polygon" points="55,169 110,115 205,34 300,88 380,169" />
          {[[110,115],[205,34],[300,88]].map(([x,y]) => <circle key={x} cx={x} cy={y} r="6" />)}
          <text x="110" y="191">5</text><text x="205" y="191">15</text><text x="300" y="191">25</text>
          <text className="axis-label" x="9" y="22">도수</text><text className="axis-label" x="349" y="205">계급값</text>
        </svg>
      </figure>;

    case '산점도':
      return <figure className="kg-note-visual">
        <figcaption>점들이 향하는 전체 방향을 살펴봐요.</figcaption>
        <svg className="kg-note-chart" viewBox="0 0 420 220" role="img" aria-label="오른쪽 위로 향하는 양의 상관관계 산점도">
          <line x1="50" y1="18" x2="50" y2="178" /><line x1="50" y1="178" x2="392" y2="178" />
          <path className="trend" d="M70 160 C155 131 248 82 370 35" />
          {[[78,153],[105,145],[132,150],[153,125],[188,119],[215,96],[240,104],[270,75],[303,69],[326,47],[359,42]].map(([x,y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="6" />)}
          <text className="axis-label" x="8" y="22">점수</text><text className="axis-label" x="334" y="207">공부 시간</text>
          <text className="chart-callout" x="270" y="26">양의 상관관계 ↗</text>
        </svg>
      </figure>;

    default:
      return null;
  }
}
