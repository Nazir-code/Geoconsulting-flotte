import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../models/app_models.dart';

class StoredSession {
  const StoredSession({
    this.token,
    this.user,
    this.driver,
  });

  final String? token;
  final User? user;
  final Driver? driver;

  StoredSession copyWith({
    String? token,
    User? user,
    Driver? driver,
    bool clear = false,
  }) {
    if (clear) {
      return const StoredSession();
    }

    return StoredSession(
      token: token ?? this.token,
      user: user ?? this.user,
      driver: driver ?? this.driver,
    );
  }
}

class SessionStore extends ValueNotifier<StoredSession> {
  SessionStore() : super(const StoredSession());

  static const _tokenKey = 'driver_token';
  static const _userKey = 'driver_user';
  static const _driverKey = 'driver_profile';

  Future<void> load() async {
    final preferences = await SharedPreferences.getInstance();
    final token = preferences.getString(_tokenKey);
    final userJson = preferences.getString(_userKey);
    final driverJson = preferences.getString(_driverKey);

    value = StoredSession(
      token: token,
      user: userJson == null
          ? null
          : User.fromJson(jsonDecode(userJson) as Map<String, dynamic>),
      driver: driverJson == null
          ? null
          : Driver.fromJson(jsonDecode(driverJson) as Map<String, dynamic>),
    );
  }

  Future<void> save(AuthSession session) async {
    final preferences = await SharedPreferences.getInstance();
    await preferences.setString(_tokenKey, session.token);
    await preferences.setString(_userKey, jsonEncode(session.user.toJson()));
    await preferences.setString(_driverKey, jsonEncode(session.driver.toJson()));

    value = StoredSession(
      token: session.token,
      user: session.user,
      driver: session.driver,
    );
  }

  Future<void> updateDriver(Driver driver) async {
    final preferences = await SharedPreferences.getInstance();
    await preferences.setString(_driverKey, jsonEncode(driver.toJson()));
    value = value.copyWith(driver: driver);
  }

  Future<void> clear() async {
    final preferences = await SharedPreferences.getInstance();
    await preferences.remove(_tokenKey);
    await preferences.remove(_userKey);
    await preferences.remove(_driverKey);
    value = value.copyWith(clear: true);
  }
}
