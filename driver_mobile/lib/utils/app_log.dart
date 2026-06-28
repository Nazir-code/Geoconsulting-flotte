import 'package:flutter/foundation.dart';

/// Logger conditionnel : actif uniquement en mode debug.
/// En release, les appels sont compilés mais le corps est vide —
/// le compilateur Dart élimine les branches mortes à l'AOT.
abstract final class AppLog {
  static void d(Object? msg) {
    if (kDebugMode) debugPrint(msg?.toString());
  }
}
