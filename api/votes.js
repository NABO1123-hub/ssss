// api/votes.js (Next.js App Router 기준: app/api/votes/route.js 도 동일하게 작성 가능)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // 서버용 시크릿 키 사용

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase environment variables are missing.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('votes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, team, scoreHome, scoreAway } = body;

    // 간단한 검증
    if (!name || !team) {
      return Response.json({ error: '이름과 결과는 필수입니다.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('votes')
      .insert({
        name,
        team,
        score_home: parseInt(scoreHome),
        score_away: parseInt(scoreAway),
      })
      .select();

    if (error) throw error;

    return Response.json(data[0], { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
