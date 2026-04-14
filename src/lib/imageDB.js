// IndexedDB 유틸리티 — 이미지 저장 및 관리

const DB_NAME = 'marimolover-images';
const STORE_NAME = 'images';
const DB_VERSION = 1;

// IndexedDB 연결 열기
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

// 이미지 저장 (id와 base64 문자열)
export function saveImage(id, base64) {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put({ id, data: base64 });

      request.onsuccess = () => resolve();
      request.onerror = (event) => reject(event.target.error);

      tx.oncomplete = () => db.close();
    } catch (err) {
      reject(err);
    }
  });
}

// 이미지 조회 (base64 문자열 반환, 없으면 null)
export function getImage(id) {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = (event) => {
        const result = event.target.result;
        resolve(result ? result.data : null);
      };

      request.onerror = (event) => reject(event.target.error);

      tx.oncomplete = () => db.close();
    } catch (err) {
      reject(err);
    }
  });
}

// 이미지 삭제
export function deleteImage(id) {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = (event) => reject(event.target.error);

      tx.oncomplete = () => db.close();
    } catch (err) {
      reject(err);
    }
  });
}

// 이미지 리사이즈 — 가장 긴 변이 maxSize px 이하가 되도록 축소
// File 객체를 받아 base64 JPEG 문자열 반환 (품질 0.85)
export function resizeImage(file, maxSize = 800) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        let { width, height } = img;

        // 가장 긴 변이 maxSize를 초과하는 경우에만 축소
        if (width > maxSize || height > maxSize) {
          if (width >= height) {
            height = Math.round((height / width) * maxSize);
            width = maxSize;
          } else {
            width = Math.round((width / height) * maxSize);
            height = maxSize;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const base64 = canvas.toDataURL('image/jpeg', 0.85);
        resolve(base64);
      };

      img.onerror = () => reject(new Error('이미지 로드 실패'));
      img.src = e.target.result;
    };

    reader.onerror = () => reject(new Error('파일 읽기 실패'));
    reader.readAsDataURL(file);
  });
}
