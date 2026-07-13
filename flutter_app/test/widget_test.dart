import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:stampy/app/app.dart';

void main() {
  testWidgets('shows the Stampy home shell', (tester) async {
    await tester.pumpWidget(const ProviderScope(child: StampyApp()));
    await tester.pumpAndSettle();

    expect(find.text('오늘의 탐험'), findsOneWidget);
    expect(find.text('홈'), findsOneWidget);
    expect(find.text('지도'), findsOneWidget);
    expect(find.text('도장'), findsOneWidget);
    expect(find.text('랭킹'), findsOneWidget);
    expect(find.text('마이'), findsOneWidget);
  });
}
