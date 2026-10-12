// 브라우저에 노출되는 키다. Google Cloud 콘솔에서 HTTP 리퍼러(배포 도메인·localhost)와 Maps JavaScript API로 사용을 제한할 것.
const CONFIG = {
  // 배포할 때마다 올린다. index.html의 ?v= 값과 BUILD 값도 같이 맞춘다 (브라우저가 옛 파일을 쓰지 않게 한다)
  VERSION: '20261012-3',
  // 연구진 공유 저장소. 비워 두면 각자 브라우저에만 저장한다 (표 정의: supabase/schema.sql)
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: '',
  // 연구용 화면 간이 잠금. 브라우저에 그대로 노출되므로 보안 수단이 아니다. 비워 두면 묻지 않는다
  STAFF_PASSCODE: '',
  // 관리자 모드 암호의 SHA-256 해시('nrf50:' + 암호). 암호 자체는 저장소에 두지 않는다.
  // 브라우저에서만 확인하므로 화면을 가리는 용도이며, 데이터를 지키는 보안 수단은 아니다
  ADMIN_HASH: '70e8a275f1109d560c5d25d81d63279396e6c71ca324655b46fdd4b45b549465',
  GOOGLE_MAPS_API_KEY: 'AIzaSyAm6icZo1ETjBZ68Cc2-dyalXRfZcUoC2o',
};
