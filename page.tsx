'use client';

import { useEffect, useState } from 'react';

interface Vote {
  id: string;
  name: string;
  team: 'home' | 'draw' | 'away';
  score_home: number;
  score_away: number;
  created_at: string;
}

export default function Home() {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [userName, setUserName] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ text: string; type: 'error' | 'success' } | null>(null);

  // 데이터 로드
  const loadVotes = async () => {
    try {
      const res = await fetch('/api/votes');
      if (!res.ok) throw new Error('로드 실패');
      const data = await res.json();
      setVotes(data);
    } catch (err) {
      setAlertMsg({ text: '데이터 로드 실패', type: 'error' });
    }
  };

  useEffect(() => {
    loadVotes();
  }, []);

  // 로그인 처리
  const handleLogin = () => {
    if (!userName.trim()) {
      setAlertMsg({ text: '이름을 입력하세요', type: 'error' });
      return;
    }
    const isAdminUser = userName.toUpperCase() === 'ADMIN';
    const isDuplicate = votes.some((v) => v.name === userName && !isAdminUser);

    if (isAdminUser) {
      setIsAdmin(true);
      setAlertMsg({ text: '관리자 모드 진입', type: 'success' });
      loadVotes();
    } else if (isDuplicate) {
      setAlertMsg({ text: '이미 투표한 이름입니다', type: 'error' });
      setUserName('');
    } else {
      setIsAdmin(false);
      setAlertMsg({ text: `${userName}님 환영합니다`, type: 'success' });
    }
  };

  // 결과 변경 시 점수 자동 입력
  const handleResultChange = (result: string) => {
    const t1 = document.getElementById('team1Score') as HTMLInputElement;
    const t2 = document.getElementById('team2Score') as HTMLInputElement;
    if (result === 'home') { t1.value = '1'; t2.value = '0'; }
    else if (result === 'away') { t1.value = '0'; t2.value = '1'; }
    else { t1.value = '0'; t2.value = '0'; }
  };

  // 투표 제출
  const submitVote = async () => {
    if (!userName) return;
    const resultInput = document.querySelector('input[name="result"]:checked') as HTMLInputElement;
    const t1 = document.getElementById('team1Score') as HTMLInputElement;
    const t2 = document.getElementById('team2Score') as HTMLInputElement;

    if (!resultInput) return;
    const result = resultInput.value;
    const t1Val = parseInt(t1.value) || 0;
    const t2Val = parseInt(t2.value) || 0;

    // 유효성 검사
    if (result === 'home' && t1Val <= t2Val) { setAlertMsg({ text: '1 팀 승 시 득점이 더 높아야 함', type: 'error' }); return; }
    if (result === 'away' && t2Val <= t1Val) { setAlertMsg({ text: '2 팀 승 시 득점이 더 높아야 함', type: 'error' }); return; }
    if (result === 'draw' && t1Val !== t2Val) { setAlertMsg({ text: '무승부 시 득점이 같아야 함', type: 'error' }); return; }

    try {
      const res = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: userName, team: result, scoreHome: t1Val, scoreAway: t2Val }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '제출 실패');

      setAlertMsg({ text: '투표 완료!', type: 'success' });
      setUserName('');
      loadVotes();
      document.getElementById('team1Score')?.setAttribute('value', '0');
      document.getElementById('team2Score')?.setAttribute('value', '0');
      document.querySelector('input[name="result"][value="home"]')?.click();
    } catch (err) {
      setAlertMsg({ text: `실패: ${err}`, type: 'error' });
    }
  };

  // 관리자 대시보드 렌더링
  const renderDashboard = () => {
    const total = votes.length;
    const homeWins = votes.filter((v) => v.team === 'home').length;
    const draws = votes.filter((v) => v.team === 'draw').length;
    const awayWins = votes.filter((v) => v.team === 'away').length;
    const avgScore = total > 0 ? (votes.reduce((acc, v) => acc + v.score_home + v.score_away, 0) / total).toFixed(1) : '0.0';

    const stats = [
      { id: 'countHome', val: homeWins },
      { id: 'countDraw', val: draws },
      { id: 'countAway', val: awayWins },
      { id: 'avgScore', val: avgScore },
    ];
    stats.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) el.textContent = String(s.val);
    });

    const tbody = document.getElementById('adminTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    const sorted = [...votes].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    sorted.forEach(v => {
      const row = document.createElement('tr');
      const time = new Date(v.created_at).toLocaleString();
      let teamText = v.team === 'home' ? '1 팀 승' : v.team === 'away' ? '2 팀 승' : '무승부';
      row.innerHTML = `<td>${v.name}</td><td>${teamText}</td><td>${v.score_home}-${v.score_away}</td><td>${time}</td>`;
      tbody.appendChild(row);
    });
  };

  useEffect(() => {
    if (isAdmin) renderDashboard();
  }, [isAdmin, votes]);

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: '450px', margin: '40px auto', padding: '20px', backgroundColor: '#f0f2f5', minHeight: '100vh', boxSizing: 'border-box' }}>
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h2>⚽ 축구 결과 투표</h2>
        <div id="loginSection">
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>이름 입력</label>
            <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleLogin()} placeholder="홍길동 또는 ADMIN" style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }} />
          </div>
          <button style={{ width: '100%', padding: '10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }} onClick={handleLogin}>입장하기</button>
        </div>
        {alertMsg && (
          <div style={{ padding: '10px', borderRadius: '5px', marginBottom: '10px', backgroundColor: alertMsg.type === 'error' ? '#ffebee' : '#e8f5e9', color: alertMsg.type === 'error' ? '#c62828' : '#2e7d32', border: `1px solid ${alertMsg.type === 'error' ? '#ef9a9a' : '#a5d6a7'}`, textAlign: 'left' }}>{alertMsg.text}</div>
        )}
        <div id="voteSection" style={{ display: isAdmin ? 'none' : 'block' }}>
          <button style={{ backgroundColor: '#9e9e9e', color: 'white', padding: '5px 10px', borderRadius: '5px', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }} onClick={() => { setIsAdmin(false); setUserName(''); }}>← 돌아가기</button>
          <div style={{ marginBottom: '10px' }}><label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>홈팀</label><input type="text" value="1 팀 (대한민국)" readonly style={{ background: '#f5f5f5', color: '#666', cursor: 'not-allowed', border: 'none', padding: '5px' }} /></div>
          <div style={{ marginBottom: '10px' }}><label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>원정팀</label><input type="text" value="2 팀 (체코)" readonly style={{ background: '#f5f5f5', color: '#666', cursor: 'not-allowed', border: 'none', padding: '5px' }} /></div>
          <div style={{ marginBottom: '10px' }}><label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>경기 결과</label><div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}><label style={{ cursor: 'pointer', fontWeight: 'normal', color: '#333' }}><input type="radio" name="result" value="home" checked onChange={() => handleResultChange('home')} /> 1 팀 승</label><label style={{ cursor: 'pointer', fontWeight: 'normal', color: '#333' }}><input type="radio" name="result" value="draw" onChange={() => handleResultChange('draw')} /> 무승부</label><label style={{ cursor: 'pointer', fontWeight: 'normal', color: '#333' }}><input type="radio" name="result" value="away" onChange={() => handleResultChange('away')} /> 2 팀 승</label></div></div>
          <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '10px', border: '1px solid #eee' }}>
            <div style={{ marginBottom: '10px' }}><label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>1 팀 득점</label><input id="team1Score" type="number" min="0" value="0" style={{ width: '80px', textAlign: 'center', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} /></div>
            <div style={{ marginBottom: '10px' }}><label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>2 팀 득점</label><input id="team2Score" type="number" min="0" value="0" style={{ width: '80px', textAlign: 'center', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} /></div>
          </div>
          <button style={{ width: '100%', padding: '10px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }} onClick={submitVote}>투표 제출하기</button>
        </div>
        <div id="adminSection" style={{ display: isAdmin ? 'block' : 'none' }}>
          <button style={{ backgroundColor: '#9e9e9e', color: 'white', padding: '5px 10px', borderRadius: '5px', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }} onClick={() => { setIsAdmin(false); setUserName(''); }}>← 돌아가기</button>
          <h2 style={{ color: '#2196F3', marginBottom: '10px' }}>📊 투표 현황 (ADMIN)</h2>
          <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '10px' }}>총 투표 수: <b>{votes.length}</b> 표</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '10px', textAlign: 'left' }}>
            <div style={{ backgroundColor: '#f0f4f8', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #2196F3' }}><div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '5px' }}>1 팀 승</div><div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#333' }}>{homeWins}</div></div>
            <div style={{ backgroundColor: '#f0f4f8', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #2196F3' }}><div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '5px' }}>무승부</div><div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#333' }}>{draws}</div></div>
            <div style={{ backgroundColor: '#f0f4f8', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #2196F3' }}><div style={{ fontSize: '0.85rem', color
