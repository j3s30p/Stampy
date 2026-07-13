import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('HTML accepts only null or finite headings in [0, 360)', () async {
    final node = await Process.run('node', <String>[
      '-e',
      _validationHarness,
      'assets/map/kakao_map.html',
    ]);

    expect(node.exitCode, 0, reason: '${node.stdout}\n${node.stderr}');
  });

  test('HTML keeps distinct dot and directional current-location markers', () {
    final html = File('assets/map/kakao_map.html').readAsStringSync();

    expect(html, contains('function currentLocationDotImage()'));
    expect(
      html,
      contains('function currentLocationArrowImage(headingDegrees)'),
    );
    expect(html, contains('currentLocationDotImage()'));
    expect(html, contains('function collectedMarkerImage()'));
  });
}

const String _validationHarness = r'''
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync(process.argv[1], 'utf8');
const match = html.match(/<script>([\s\S]*)<\/script>/);
if (!match) throw new Error('inline map script not found');

const source = match[1].replace(
  '__STAMPY_KAKAO_JS_KEY_JSON__',
  JSON.stringify('test-key'),
);
const messages = [];
let appendedScript = null;
const context = {
  console,
  encodeURIComponent,
  document: {
    createElement: () => ({}),
    getElementById: () => ({}),
    head: { appendChild: (script) => { appendedScript = script; } },
  },
  window: {
    addEventListener: () => {},
    StampyBridge: {
      postMessage: (raw) => messages.push(JSON.parse(raw)),
    },
  },
};
vm.runInNewContext(source, context, { filename: 'kakao_map.html' });

const markerImages = [];
const markers = [];
const maps = {
  LatLng: function LatLng(lat, lng) { this.lat = lat; this.lng = lng; },
  Size: function Size(width, height) { this.width = width; this.height = height; },
  Point: function Point(x, y) { this.x = x; this.y = y; },
  MarkerImage: function MarkerImage(url, size) {
    this.url = url;
    this.size = size;
    markerImages.push(this);
  },
  Marker: function Marker(options) {
    this.options = options;
    this.setMap = () => {};
    this.setImage = (image) => { this.options.image = image; };
    this.setPosition = (position) => { this.options.position = position; };
    markers.push(this);
  },
  Circle: function Circle(options) {
    this.options = options;
    this.setMap = () => {};
  },
  Map: function Map() {
    this.relayout = () => {};
    this.setCenter = () => {};
  },
  event: { addListener: () => {} },
  load: (createMap) => createMap(),
};
context.kakao = { maps };
context.window.kakao = context.kakao;
appendedScript.onload();

function command(heading) {
  return {
    version: 1,
    type: 'setMapData',
    payload: {
      center: { lat: 37.579617, lng: 126.977041 },
      currentLocation: { lat: 37.579617, lng: 126.977041 },
      currentHeadingDegrees: heading,
      selectedContentId: null,
      selectedRadiusMeters: 100,
      pins: [],
    },
  };
}

function isAccepted(heading) {
  messages.length = 0;
  context.window.StampyKakaoMap.receive(command(heading));
  return !messages.some((message) => message.code === 'invalidCommand');
}

for (const valid of [null, 0, 123.5, 359.999]) {
  if (!isAccepted(valid)) throw new Error(`rejected valid heading: ${valid}`);
}
for (const invalid of [-0.001, 360, Infinity, NaN, '90', undefined]) {
  if (isAccepted(invalid)) throw new Error(`accepted invalid heading: ${invalid}`);
}

messages.length = 0;
markerImages.length = 0;
const markerCountBeforeHeadingUpdate = markers.length;
context.window.StampyKakaoMap.setCurrentHeading(270);
if (messages.length !== 0) throw new Error('rejected valid heading-only update');
if (markers.length !== markerCountBeforeHeadingUpdate) {
  throw new Error('heading-only update recreated the current-location marker');
}
const arrowImage = markerImages.at(-1);
if (!arrowImage || arrowImage.size.width !== 40) {
  throw new Error('heading did not render the directional marker');
}
if (!decodeURIComponent(arrowImage.url).includes('rotate(270 20 20)')) {
  throw new Error('directional marker did not rotate to the supplied heading');
}

markerImages.length = 0;
context.window.StampyKakaoMap.setCurrentHeading(null);
if (messages.length !== 0) throw new Error('rejected null heading-only update');
const dotImage = markerImages.at(-1);
if (!dotImage || dotImage.size.width !== 28) {
  throw new Error('null heading did not render the current-location dot');
}

context.window.StampyKakaoMap.setCurrentHeading(360);
if (!messages.some((message) => message.code === 'invalidHeading')) {
  throw new Error('accepted invalid heading-only update');
}

messages.length = 0;
markerImages.length = 0;
markers.length = 0;
const collectedCommand = command(null);
collectedCommand.payload.currentLocation = null;
collectedCommand.payload.selectedContentId = 'event-collected';
collectedCommand.payload.pins = [{
  contentId: 'event-collected',
  title: '수집한 행사',
  kind: 'event',
  collected: true,
  location: { lat: 37.579617, lng: 126.977041 },
}];
context.window.StampyKakaoMap.receive(collectedCommand);
if (messages.length !== 0) throw new Error('rejected collected marker payload');
const collectedMarker = markers.at(-1);
if (!collectedMarker) throw new Error('did not render a collected marker');
const collectedSvg = decodeURIComponent(collectedMarker.options.image.url);
if (!collectedSvg.includes('fill="#d95432"')) {
  throw new Error('collected marker did not use vermilion');
}
if (!collectedSvg.includes('M8.5 14.8L12.3 18.6L19.7 10.8')) {
  throw new Error('collected marker did not use the check glyph');
}
''';
