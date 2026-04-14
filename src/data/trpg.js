// 초기 TRPG 데이터
export const initialTrpg = {
  campaigns: [
    {
      id: 'campaign-1',
      title: '심연의 계약',
      system: '코즈믹 호러 TRPG',
      description: '크툴루 신화를 배경으로 한 탐사 캠페인. 이성을 지키며 진실에 다가가는 이야기.',
      createdAt: '2024-01-01',
    },
  ],
  sessions: [
    {
      id: 'session-1',
      campaignId: 'campaign-1',
      title: '1화 — 오래된 저택',
      date: '2024-01-15',
      summary: '의뢰인의 저택을 조사하던 탐사자들이 지하실에서 수상한 제단을 발견했다.',
      log: [], // CCFOLIA HTML 파싱 결과
      createdAt: '2024-01-15',
    },
  ],
}
