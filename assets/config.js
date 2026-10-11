// 브라우저에 노출되는 키다. Google Cloud 콘솔에서 HTTP 리퍼러(배포 도메인·localhost)와 Maps JavaScript API로 사용을 제한할 것.
const CONFIG = {
  // 배포할 때마다 올린다. index.html의 ?v= 값과 맞춰 브라우저가 옛 파일을 쓰지 않게 한다
  VERSION: '20261011-3',
  GOOGLE_MAPS_API_KEY: 'AIzaSyAm6icZo1ETjBZ68Cc2-dyalXRfZcUoC2o',
};
