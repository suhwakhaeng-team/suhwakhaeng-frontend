import { useEffect, useState } from 'react';
import { apiClient } from '../../lib/apiClient';
type Tag = {id:number;name:string;color:string;graphVisible:boolean};
export default function TagCatalogPage() {
  const [tags,setTags]=useState<Tag[]>([]);
  const [query,setQuery]=useState('');
  const [loading,setLoading]=useState(true);const [error,setError]=useState('');
  useEffect(()=>{let active=true;void apiClient.get<Tag[]>('/tag-catalog').then(res=>{
    if(!active)return;
    if(res.success && res.data)setTags(res.data);else setError(res.error || '목록을 불러오지 못했습니다.');
    setLoading(false);
  });return()=>{active=false;};},[]);
  const shown=tags.filter(tag=>tag.name.includes(query.trim()));
  return <section style={{padding:20,maxWidth:880,margin:'0 auto'}}>
    <h1>태그 목록</h1>
    <label>태그 검색 <input aria-label="태그 검색" value={query} onChange={e=>setQuery(e.target.value)} placeholder="예: 표준편차" /></label>
    {loading ? <p>불러오는 중…</p> : error ? <p role="alert">{error}</p> : <>
      <p>전체 {tags.length}개 · 검색 결과 {shown.length}개</p>
      {shown.length===0 && <p>해당하는 태그가 없습니다.</p>}
      <ul style={{listStyle:'none',padding:0}}>{shown.map(tag=><li key={tag.id} style={{padding:'12px 0',borderBottom:'1px solid #ddd'}}>{tag.name}</li>)}</ul>
    </>}
  </section>;
}
