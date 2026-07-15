# 01 · Domain Glossary

> 한국어 명칭과 영문 식별자를 1:1 로 고정한다. PR 리뷰에서 “스팟인지 장소인지” 같은 동의어 충돌이 발견되면 이 문서를 우선 갱신한다.

| 한글               | 영문 식별자                    | 정의                                                                                                                                         |
| ------------------ | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 도장               | `Stamp`                        | 사용자가 특정 도장 스팟에서 위치 인증을 통과해 획득한 디지털 배지. 1 user × 1 spot 에 최대 1개.                                              |
| 도장 스팟          | `StampSpot`                    | 도장을 수집할 수 있는 지점. `Coordinates` + `radiusMeters` + 1개의 `TourSpot` 참조.                                                          |
| 관광지             | `TourSpot`                     | TourAPI 의 콘텐츠 항목. 모든 `StampSpot` 은 1개의 `TourSpot` 으로 backed. 역은 성립하지 않는다 (모든 관광지가 도장 스팟이 되는 것은 아니다). |
| 인증               | `Verification`                 | 사용자 GPS 가 `StampSpot.location` 으로부터 `STAMP_RADIUS_METERS` 이내라는 판단 결과. 액션 없이 boolean.                                     |
| 수집               | `Collection` (verb: `collect`) | 인증 통과 후 사용자가 명시적으로 “도장 찍기” 액션을 실행하여 `Stamp` 인스턴스를 생성하는 절차.                                               |
| 코스               | `Course`                       | 정해진 순서의 `StampSpot` 묶음. 완주 시 보너스 배지. (Phase 2 — 본 단계 비대상)                                                              |
| 콘텐츠 ID          | `contentId`                    | TourAPI 가 부여하는 글로벌 식별자. 모든 외부 참조의 기준키. 문자열.                                                                          |
| 콘텐츠 타입        | `contentTypeId`                | TourAPI 분류 코드. 관광지=12, 문화시설=14, 행사/축제=15, 여행코스=25, 레포츠=28, 숙박=32, 쇼핑=38, 음식점=39.                                |
| 법정동 시도 코드   | `ldongRegionCode`              | TourAPI 현행 필드 `lDongRegnCd`를 정규화한 시도 코드. 문자열이며 행정구역 개편 시 갱신될 수 있다.                                            |
| 법정동 시군구 코드 | `ldongSigunguCode`             | TourAPI 현행 필드 `lDongSignguCd`를 정규화한 시군구 코드. `ldongRegionCode`에 종속되며 두 코드의 복합쌍으로 식별한다.                        |

## 동의어 금지

- ❌ "장소" / "포인트" / "Location" → ✅ `StampSpot` 또는 `TourSpot` 중 하나로.
- ❌ "체크인" / "방문" → ✅ `verify` (판단) / `collect` (액션) 둘로 분리.
- ❌ "배지" → 별도 개념 도입 전까지 `Stamp` 와 동의어 금지.
