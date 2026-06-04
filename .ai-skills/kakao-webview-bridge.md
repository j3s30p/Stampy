---
name: kakao-webview-bridge
description: Kakao Maps 를 react-native-webview 로 호스팅하면서 RN ↔ WebView 메시지를 KakaoBridgeMessage discriminated union 으로 직렬화한다.
triggers:
  - WebView postMessage / injectedJavaScript
  - 마커 탭 / 카메라 이동 / 위치 동기화
  - HTML 템플릿 · CSP · Kakao JS SDK 로딩
owner-paths:
  - src/features/map/
status: stub
filled-in-stage: 2
---

## Intent

WebView 브리지는 타입이 없는 자유 통로다. 한 번이라도 양방향이 “string with whatever JSON” 이 되면 회귀가 끝없이 생긴다. `KakaoBridgeMessage` discriminated union 을 양쪽 단일 출처로 사용하고 모든 송수신을 한 함수로 통과시킨다.

## To be filled in Stage 2

- HTML 템플릿 (assets/kakao-map.html) 와 Kakao JS SDK 로드 방식 (key=`EXPO_PUBLIC_KAKAO_JS_KEY`)
- 양방향 메시지 카탈로그: `ready`, `marker:tap`, `camera:move`, `viewport:request`, `viewport:apply`
- `postMessageToWebView(msg: KakaoBridgeMessage)` / `onMessageFromWebView(parser)` 시그니처
- Android `originWhitelist` / CSP 주의사항
- 테스트: parser 가 unknown kind 를 거부하는지, malformed JSON 에 throw 하지 않는지
