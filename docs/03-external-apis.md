# 03 · External APIs — 함정과 비공식 동작

> 공식 문서에 없거나 _있어도 못 보고 지나치는_ 동작을 모은다. 새 사실은 발견 즉시 본 문서에 추가하고, 코드 fix 와 같은 PR 에서 반영한다.

## 한국관광공사 TourAPI (KorService2)

### 인증

- 인증키는 **URL 인코딩 된 것** 과 **디코딩 된 것** 두 형태로 발급된다. `serviceKey` 파라미터에는 _디코딩 된 키_ 를 axios/fetch 가 다시 인코딩하도록 넘기는 것이 안전하다. 이미 인코딩된 키를 그대로 넣으면 `%` 가 이중 인코딩되어 401.
- Flutter 정본에서는 디코딩 키를 Edge Function의 `TOUR_API_SERVICE_KEY` secret으로만 보관한다. 앱의 `dart-define`이나 `EXPO_PUBLIC_*`에 넣지 않는다.

### 운영 도장 스팟 동기화

- `GET https://apis.data.go.kr/B551011/KorService2/detailCommon2`를 사용한다.
- 필수 파라미터는 `serviceKey`, `MobileOS`, `MobileApp`, `contentId`다. JSON 응답을 위해 `_type=json`을 함께 보낸다.
- `contentTypeId`는 요청자가 보내지 않는다. 응답 `contenttypeid`를 정본으로 `15 → event`, 나머지 지원 타입 → `spot`으로 정규화한다.
- 한 요청은 `contentId` 하나만 조회하므로 Edge Function이 명시된 ID 목록을 각각 조회한다. 모든 항목 검증이 끝난 뒤 한 번에 upsert하며, 요청하지 않은 기존 행은 삭제하지 않는다.
- 함수 호출 자격은 별도 `STAMP_SPOT_SYNC_TOKEN`으로 검증한다. service-role 키는 함수 내부 DB 쓰기에만 사용한다.

### 좌표 표현

- `mapx` = **경도** (longitude), `mapy` = **위도** (latitude). OGC 관습(x=lon, y=lat)을 따르지만 흔히 swap 한다. mapper 에서 반드시 `asLongitude(parseFloat(mapx))`, `asLatitude(parseFloat(mapy))` 로 변환한다.
- 일부 응답에 `""` (빈 문자열) 좌표 가 있다. 매핑 시 `null` 로 떨궈 도메인 진입 차단.

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

- Android 에서는 `originWhitelist={['*']}` 를 명시하지 않으면 `postMessage` 가 silent drop.
- iOS WKWebView 는 `injectedJavaScriptBeforeContentLoaded` 가 필요한 케이스가 있음 (SDK 로드 전 환경 주입).
- CSP: Kakao SDK 는 `dapi.kakao.com` 외에도 `t1.daumcdn.net`, `map.daumcdn.net` 호출. HTML 템플릿의 `<meta http-equiv="Content-Security-Policy">` 화이트리스트 필수.

## Expo Location

- 권한은 `requestForegroundPermissionsAsync` 만 사용. 백그라운드 위치는 도장 인증 UX 가 요구하지 않으므로 권한 패널을 늘리지 않는다.
- `getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })` 이 도심 5~30m, `High` 는 3~10m 이지만 발열·배터리 비용. Balanced 를 기본값으로 시작.
- 반환된 `coords.accuracy` (단위: m, 1σ) 가 `STAMP_RADIUS_METERS` 보다 크면 인증을 거부한다 (Stage 2 skill 에서 강제).
