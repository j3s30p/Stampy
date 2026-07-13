import 'package:flutter/widgets.dart';

bool shouldPresentStampCollectSuccess({
  required bool isRouteVisible,
  required AppLifecycleState? lifecycleState,
}) => isRouteVisible && lifecycleState == AppLifecycleState.resumed;
