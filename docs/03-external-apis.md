# 03 · External APIs — 함정과 비공식 동작

> 공식 문서에 없거나 _있어도 못 보고 지나치는_ 동작을 모은다. 새 사실은 발견 즉시 본 문서에 추가하고, 코드 fix 와 같은 PR 에서 반영한다.

## 한국관광공사 TourAPI (KorService2)

### 인증

- 인증키는 **URL 인코딩 된 것** 과 **디코딩 된 것** 두 형태로 발급된다. `serviceKey` 파라미터에는 _디코딩 된 키_ 를 axios/fetch 가 다시 인코딩하도록 넘기는 것이 안전하다. 이미 인코딩된 키를 그대로 넣으면 `%` 가 이중 인코딩되어 401.
- 디코딩 키는 Edge Function의 `TOUR_API_SERVICE_KEY` secret으로만 보관한다. Flutter `dart-define`이나 다른 클라이언트 설정에 넣지 않는다.

### 운영 도장 스팟 동기화

- 위치 기반 부트스트랩은 `GET https://apis.data.go.kr/B551011/KorService2/locationBasedList2`를 사용해 거리순(`arrange=E`) `contentId`를 발견한다. 요청 반경은 1~20,000m, 최대 개수는 1~20으로 제한한다.
- `GET https://apis.data.go.kr/B551011/KorService2/detailCommon2`를 사용한다.
- 필수 파라미터는 `serviceKey`, `MobileOS`, `MobileApp`, `contentId`다. JSON 응답을 위해 `_type=json`을 함께 보낸다.
- `contentTypeId`는 요청자가 보내지 않는다. 응답 `contenttypeid`를 정본으로 `15 → event`, 나머지 지원 타입 → `spot`으로 정규화한다.
- 함수 요청은 `contentIds` 또는 `nearby` 중 정확히 하나만 허용한다. 발견하거나 명시한 ID는 `detailCommon2`로 각각 조회하고, 모든 항목 검증이 끝난 뒤 한 번에 upsert한다. 요청하지 않은 기존 행은 삭제하지 않는다.
- 함수 호출 자격은 별도 `STAMP_SPOT_SYNC_TOKEN`으로 검증한다. service-role 키는 함수 내부 DB 쓰기에만 사용한다.

### 좌표 표현

- `mapx` = **경도** (longitude), `mapy` = **위도** (latitude). OGC 관습(x=lon, y=lat)을 따르지만 흔히 swap 한다. Edge Function에서 순서를 고정해 정규화하고 Flutter repository 경계에서 `Longitude` / `Latitude` 값 객체로 변환한다.
- 일부 응답에 `""` (빈 문자열) 좌표가 있다. Edge Function은 유한한 숫자와 범위를 검증해 잘못된 항목의 도메인 진입을 차단한다.

### 응답 포맷

- 기본 XML. JSON 응답을 받으려면 `_type=json` 쿼리 파라미터 명시 필요.
- 성공: `response.header.resultCode === "0000"`. 그 외는 에러로 매핑.
- 인증·게이트웨이 오류는 `_type=json`이어도 non-2xx 또는 XML 본문일 수 있다. HTTP 상태를 먼저 검사하고 JSON 파싱 실패도 안전한 상류 오류로 처리한다.
- 페이지네이션: `numOfRows`, `pageNo`, 총건수는 `response.body.totalCount`.

### 코드표

- `contentTypeId`: 12=관광지, 14=문화시설, 15=행사/축제, 25=여행코스, 28=레포츠, 32=숙박, 38=쇼핑, 39=음식점. 1~6 은 KorService1 잔재로 v2 에서 사용하지 않는다.

## Kakao Maps JS SDK (in WebView)

### 로드

- `<script src="//dapi.kakao.com/v2/maps/sdk.js?appkey={KEY}&autoload=false">` 후 `kakao.maps.load(callback)` 으로 명시 초기화.
- `autoload=false` 를 빠뜨리면 WebView 첫 페인트 전에 SDK 가 DOM 을 잡으면서 race condition.

### 좌표

- 생성자 시그니처가 `kakao.maps.LatLng(lat, lng)` — TourAPI `(mapx, mapy) = (lon, lat)` 와 **순서가 반대**.
- mapper 를 단일 진입점으로 두고 swap 을 한 곳에서만 처리. cf. ADR-007.

### WebView 통합

- Flutter는 `flutter_app/assets/map/kakao_map.html`을 읽고 JavaScript 키를 JSON 문자열로 주입한 뒤 `https://stampy.local/` base URL로 로드한다.
- JavaScript → Dart 이벤트는 `StampyBridge` 채널과 프로토콜 버전 1을 사용한다. 알 수 없는 타입, 초과 필드, 잘못된 길이의 값은 거부한다.
- 오류 메시지는 앱으로 보내기 전에 JavaScript 키와 `appkey` 값을 마스킹한다.

## Geolocator

- 위치 서비스 상태와 권한을 확인하고 필요할 때 전경 권한만 요청한다. 백그라운드 위치는 사용하지 않는다.
- `Geolocator.getCurrentPosition`은 `LocationAccuracy.high`와 15초 제한을 사용한다.
- 반환된 `accuracy`가 없거나 유효하지 않거나 100m를 초과하면 도장 인증을 거부한다.
