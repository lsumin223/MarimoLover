// 초기 갤러리 데이터 (이미지는 IndexedDB에 저장되므로 imageIds는 빈 배열)
export const initialGallery = [
  {
    id: 'gallery-1',
    title: '별빛 아래의 두 사람',
    workId: 'work-1',
    characterTags: ['char-1', 'char-2'],
    imageIds: [],
    date: '2024-03-10',
    createdAt: '2024-03-10',
  },
  {
    id: 'gallery-2',
    title: '리온 전신 컨셉',
    workId: 'work-1',
    characterTags: ['char-1'],
    imageIds: [],
    date: '2024-02-14',
    createdAt: '2024-02-14',
  },
  {
    id: 'gallery-3',
    title: '도시의 이면 — 밤거리',
    workId: 'work-2',
    characterTags: ['char-3'],
    imageIds: [],
    date: '2024-01-20',
    createdAt: '2024-01-20',
  },
]
