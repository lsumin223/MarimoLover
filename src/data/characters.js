// 초기 캐릭터 데이터
// type: 'individual' | 'group'
// individual: 단일 캐릭터
// group: 2인 이상 관계 (페어, 다인 모두 포함)
export const initialCharacters = [
  {
    id: 'char-1',
    type: 'individual',
    name: '리온 아스트레아',
    thumbnailImageId: null,
    fullBodyImageId: null,
    headImageId: null,
    bio: '별빛 기사단의 단장. 냉정해 보이지만 부하들에게는 한없이 다정하다.',
    personality: '',
    traits: '',
    profileFields: [
      { id: 'pf-1', label: '나이', value: '27세' },
      { id: 'pf-2', label: '성별', value: '남' },
      { id: 'pf-3', label: '출신', value: '북부 변경 귀족' },
      { id: 'pf-4', label: '능력', value: '성광 검술 / 별빛 조작' },
    ],
    relations: [
      { characterId: 'char-2', description: '어릴 때부터 함께한 동료이자 가장 믿는 부관.' },
    ],
    timeline: [
      { id: 't-1', event: '기사단 입단', date: '10년 전', description: '15세에 최연소로 별빛 기사단에 입단.' },
      { id: 't-2', event: '단장 취임', date: '3년 전', description: '전임 단장의 전사 이후 최연소 단장으로 취임.' },
    ],
    colors: [],
    createdAt: '2023-01-20',
  },
  {
    id: 'char-2',
    type: 'individual',
    name: '세라핀 루나',
    thumbnailImageId: null,
    fullBodyImageId: null,
    headImageId: null,
    bio: '기사단의 부단장 겸 마법사. 논리적이고 박식하며 숫자에 밝다.',
    personality: '',
    traits: '',
    profileFields: [
      { id: 'pf-6', label: '나이', value: '26세' },
      { id: 'pf-7', label: '성별', value: '여' },
      { id: 'pf-8', label: '출신', value: '왕도 마법 학원' },
      { id: 'pf-9', label: '능력', value: '달빛 마법 / 결계술' },
    ],
    relations: [
      { characterId: 'char-1', description: '단장이자 오랜 친구. 솔직히 말해줄 수 있는 유일한 상대.' },
    ],
    timeline: [
      { id: 't-3', event: '마법 학원 수석 졸업', date: '8년 전', description: '역대 최고점으로 왕도 마법 학원을 졸업.' },
      { id: 't-4', event: '기사단 합류', date: '5년 전', description: '리온의 권유로 기사단 마법사 부대장으로 합류.' },
    ],
    colors: [],
    createdAt: '2023-01-21',
  },
  {
    id: 'char-3',
    type: 'individual',
    name: '하야시 켄',
    thumbnailImageId: null,
    fullBodyImageId: null,
    headImageId: null,
    bio: '겉으로는 평범한 대학생. 실은 도시의 요괴들과 협상하는 중재자.',
    personality: '',
    traits: '',
    profileFields: [
      { id: 'pf-11', label: '나이', value: '21세' },
      { id: 'pf-12', label: '성별', value: '남' },
      { id: 'pf-13', label: '출신', value: '도쿄 출생' },
      { id: 'pf-14', label: '능력', value: '요괴어 이해 / 영적 감지' },
    ],
    relations: [],
    timeline: [
      { id: 't-5', event: '요괴 목격', date: '3년 전', description: '처음으로 요괴의 존재를 인식하게 됨.' },
    ],
    colors: [],
    createdAt: '2023-09-01',
  },
  {
    id: 'char-group-1',
    type: 'group',
    thumbnailImageId: null,
    description: '함께라면 못 이룰 것이 없다고 믿는 두 사람. 서로의 부족한 부분을 채워주는 이상적인 파트너.',
    timeline: [
      { id: 'pt-1', event: '첫 만남', date: '15년 전', description: '어린 시절 마을 도서관에서 처음 만남.' },
      { id: 'pt-2', event: '함께 기사단에 지원', date: '8년 전', description: '서로 약속하고 함께 기사단 시험에 응시.' },
    ],
    colors: [],
    members: [
      { id: 'member-g1-1', name: '리온 아스트레아', role: '단장', bio: '', imageId: null },
      { id: 'member-g1-2', name: '세라핀 루나', role: '부단장', bio: '', imageId: null },
    ],
    createdAt: '2023-02-01',
  },
]
