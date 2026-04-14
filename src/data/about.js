// 초기 어바웃 페이지 데이터
export const initialAbout = {
  profile: {
    nickname: '마리모',
    profileImageId: null,
    bio: '판타지와 현대물을 좋아하는 창작자입니다. 주로 오리지널 캐릭터를 씁니다.',
    likes: ['이세계 판타지', '버디물', '감정 억압하는 캐릭터', '나중에 무너지는 순간'],
    dislikes: ['NTR', '과도한 폭력 묘사', '캐릭터 능욕'],
    interaction: {
      enabled: true,
      notes: '감상 댓글은 언제나 환영합니다. 교류는 작품을 어느 정도 파악한 분들과 합니다.',
    },
    creativeNotes: '2차 창작은 비상업 범위 내에서 자유롭게 허용합니다. 단, R18은 사전 문의 부탁드립니다.',
    customSections: [
      { id: 'cs-1', title: '사용 툴', content: 'Clip Studio Paint, Procreate' },
      { id: 'cs-2', title: '활동 시간대', content: '주로 밤 10시 이후' },
    ],
    links: [
      { id: 'link-1', label: 'Twitter/X', url: 'https://twitter.com/', icon: 'twitter' },
      { id: 'link-2', label: 'Pixiv', url: 'https://pixiv.net/', icon: 'palette' },
    ],
  },
  notices: [
    {
      id: 'notice-1',
      title: '사이트 오픈했습니다',
      content: '오리지널 창작 정리용 개인 사이트를 만들었습니다. 천천히 내용을 채워나갈 예정이에요.',
      pinned: true,
      createdAt: '2024-03-01',
    },
  ],
  guestbook: [],
}
