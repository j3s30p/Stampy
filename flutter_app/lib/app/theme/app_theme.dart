import 'package:flutter/material.dart';
import 'package:stampy/app/theme/app_colors.dart';

abstract final class StampyTheme {
  static ThemeData light() {
    final colorScheme =
        ColorScheme.fromSeed(
          seedColor: StampyColors.accent,
          brightness: Brightness.light,
          surface: StampyColors.paper,
        ).copyWith(
          primary: StampyColors.accent,
          onPrimary: StampyColors.paper,
          secondary: StampyColors.ink,
          onSecondary: StampyColors.paper,
          surface: StampyColors.paper,
          onSurface: StampyColors.ink,
          outline: StampyColors.hairline,
          outlineVariant: StampyColors.hairline,
          error: StampyColors.accent,
          onError: StampyColors.paper,
        );

    final baseTheme = ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: colorScheme,
      fontFamily: 'Pretendard',
      scaffoldBackgroundColor: StampyColors.canvas,
      splashFactory: InkSparkle.splashFactory,
      visualDensity: VisualDensity.standard,
    );

    return baseTheme.copyWith(
      textTheme: _textTheme(baseTheme.textTheme),
      appBarTheme: const AppBarTheme(
        backgroundColor: StampyColors.canvas,
        foregroundColor: StampyColors.ink,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        centerTitle: false,
      ),
      cardTheme: CardThemeData(
        color: StampyColors.paper,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: StampyColors.hairline),
        ),
      ),
      dividerTheme: const DividerThemeData(
        color: StampyColors.hairline,
        thickness: 1,
        space: 1,
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: const Size(44, 52),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: StampyColors.ink,
          minimumSize: const Size(44, 52),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          side: const BorderSide(color: StampyColors.hairline),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: StampyColors.paper,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 15,
        ),
        hintStyle: const TextStyle(color: StampyColors.mutedInk),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: StampyColors.hairline),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: StampyColors.accent, width: 1.5),
        ),
      ),
      chipTheme: baseTheme.chipTheme.copyWith(
        backgroundColor: StampyColors.paper,
        selectedColor: StampyColors.paleAccent,
        side: const BorderSide(color: StampyColors.hairline),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
        labelStyle: const TextStyle(
          color: StampyColors.ink,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: StampyColors.paper,
        surfaceTintColor: Colors.transparent,
        showDragHandle: true,
        dragHandleColor: StampyColors.hairline,
      ),
      progressIndicatorTheme: const ProgressIndicatorThemeData(
        color: StampyColors.accent,
        linearTrackColor: StampyColors.hairline,
      ),
    );
  }

  static TextTheme _textTheme(TextTheme base) {
    return base.copyWith(
      displaySmall: const TextStyle(
        color: StampyColors.ink,
        fontSize: 34,
        height: 1.18,
        letterSpacing: -1.1,
        fontWeight: FontWeight.w800,
      ),
      headlineLarge: const TextStyle(
        color: StampyColors.ink,
        fontSize: 28,
        height: 1.22,
        letterSpacing: -0.7,
        fontWeight: FontWeight.w800,
      ),
      headlineMedium: const TextStyle(
        color: StampyColors.ink,
        fontSize: 22,
        height: 1.3,
        letterSpacing: -0.4,
        fontWeight: FontWeight.w700,
      ),
      titleLarge: const TextStyle(
        color: StampyColors.ink,
        fontSize: 18,
        height: 1.35,
        letterSpacing: -0.2,
        fontWeight: FontWeight.w700,
      ),
      titleMedium: const TextStyle(
        color: StampyColors.ink,
        fontSize: 15,
        height: 1.4,
        fontWeight: FontWeight.w700,
      ),
      bodyLarge: const TextStyle(
        color: StampyColors.ink,
        fontSize: 16,
        height: 1.55,
        letterSpacing: -0.1,
        fontWeight: FontWeight.w400,
      ),
      bodyMedium: const TextStyle(
        color: StampyColors.ink,
        fontSize: 14,
        height: 1.55,
        letterSpacing: -0.1,
        fontWeight: FontWeight.w400,
      ),
      bodySmall: const TextStyle(
        color: StampyColors.mutedInk,
        fontSize: 12,
        height: 1.5,
        fontWeight: FontWeight.w500,
      ),
      labelLarge: const TextStyle(
        color: StampyColors.ink,
        fontSize: 14,
        height: 1.2,
        fontWeight: FontWeight.w700,
      ),
      labelMedium: const TextStyle(
        color: StampyColors.mutedInk,
        fontSize: 11,
        height: 1.2,
        letterSpacing: 0.8,
        fontWeight: FontWeight.w700,
      ),
    );
  }
}
