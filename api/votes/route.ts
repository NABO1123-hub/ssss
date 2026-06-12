import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 환경 변수에서 Supabase 정보 가져오기
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  return NextResponse.json({ error: 'Supabase 설정이 없습니다' }, { status: 500 });
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 투표 목록 조회 (GET)
export async function GET() {
  try {
    const { data, error } = await supabase.from('votes').select('*');
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 투표 저장 (POST)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, team, scoreHome, scoreAway } = body;

    if (!name || !team) {
      return NextResponse.json({ error: '이름과 팀이 필요합니다' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('votes')
      .insert({ name, team, score_home: parseInt(scoreHome), score_away: parseInt(scoreAway) })
      .select();

    if (error) throw error;
    return NextResponse.json(data[0], { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
