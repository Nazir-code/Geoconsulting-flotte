import 'dart:convert';

import 'package:http/http.dart' as http;

import '../models/app_models.dart';
import 'session_store.dart';

class ApiService {
  ApiService({required this.sessionStore});

  final SessionStore sessionStore;

  static const _defaultBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3000',
  );

  String get baseUrl => _defaultBaseUrl;

  Future<AuthSession> login({
    required String email,
    required String password,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/auth/login'),
      headers: _headers(),
      body: jsonEncode({
        'email': email,
        'password': password,
      }),
    );

    final payload = _readPayload(response);
    return AuthSession.fromJson(payload as Map<String, dynamic>);
  }

  Future<DriverDashboardData> loadDashboard() async {
    final responses = await Future.wait([
      _get('/api/driver/me'),
      _get('/api/driver/me/vehicle'),
      _get('/api/driver/me/missions'),
      _get('/api/driver/me/missions/active'),
      _get('/api/driver/me/fuel-records'),
      _get('/api/gps/positions'),
    ]);

    final driver = Driver.fromJson(responses[0] as Map<String, dynamic>);
    final vehicleJson = responses[1];
    final missionList = (responses[2] as List<dynamic>)
        .map((item) => Mission.fromJson(item as Map<String, dynamic>))
        .toList();
    final activeMissionJson = responses[3];
    final fuelRecords = (responses[4] as List<dynamic>)
        .map((item) => FuelRecord.fromJson(item as Map<String, dynamic>))
        .toList();
    final gpsPositions = (responses[5] as List<dynamic>)
        .map((item) => GpsPosition.fromJson(item as Map<String, dynamic>))
        .toList();

    final vehicle = vehicleJson == null
        ? null
        : Vehicle.fromJson(vehicleJson as Map<String, dynamic>);
    final activeMission = activeMissionJson == null
        ? null
        : Mission.fromJson(activeMissionJson as Map<String, dynamic>);
    final gpsPosition = vehicle == null
        ? null
        : gpsPositions.cast<GpsPosition?>().firstWhere(
              (position) => position?.vehicleId == vehicle.id,
              orElse: () => null,
            );

    return DriverDashboardData(
      driver: driver,
      vehicle: vehicle,
      missions: missionList,
      activeMission: activeMission,
      fuelRecords: fuelRecords,
      gpsPosition: gpsPosition,
    );
  }

  Future<Mission> startMission({
    required String destination,
    required String purpose,
    String startLocation = 'Niamey',
  }) async {
    final response = await _post(
      '/api/driver/me/missions',
      body: {
        'destination': destination,
        'purpose': purpose,
        'startLocation': startLocation,
      },
    );
    return Mission.fromJson(response as Map<String, dynamic>);
  }

  Future<Mission> completeMission({
    required String missionId,
    required num distance,
    required num fuelConsumed,
    String? notes,
  }) async {
    final response = await _post(
      '/api/driver/me/missions/$missionId/complete',
      body: {
        'distance': distance,
        'fuelConsumed': fuelConsumed,
        'notes': notes,
      },
    );
    return Mission.fromJson(response as Map<String, dynamic>);
  }

  Future<Mission> cancelMission({
    required String missionId,
    String reason = '',
  }) async {
    final response = await _post(
      '/api/driver/me/missions/$missionId/cancel',
      body: {'reason': reason},
    );
    return Mission.fromJson(response as Map<String, dynamic>);
  }

  Future<FuelRecord> createFuelRecord({
    required num quantity,
    required num pricePerLiter,
    required num mileage,
    String? station,
  }) async {
    final response = await _post(
      '/api/driver/me/fuel-records',
      body: {
        'quantity': quantity,
        'pricePerLiter': pricePerLiter,
        'mileage': mileage,
        'station': station,
      },
    );
    return FuelRecord.fromJson(response as Map<String, dynamic>);
  }

  Future<dynamic> _get(String path) async {
    final response = await http.get(
      Uri.parse('$baseUrl$path'),
      headers: _headers(withAuth: true),
    );
    return _readPayload(response);
  }

  Future<dynamic> _post(String path, {required Map<String, dynamic> body}) async {
    final response = await http.post(
      Uri.parse('$baseUrl$path'),
      headers: _headers(withAuth: true),
      body: jsonEncode(body),
    );
    return _readPayload(response);
  }

  Map<String, String> _headers({bool withAuth = false}) {
    final headers = <String, String>{
      'Content-Type': 'application/json',
    };

    if (withAuth && sessionStore.value.token != null) {
      headers['Authorization'] = 'Bearer ${sessionStore.value.token}';
    }

    return headers;
  }

  dynamic _readPayload(http.Response response) {
    final body = response.body.isEmpty
        ? <String, dynamic>{}
        : jsonDecode(response.body) as Map<String, dynamic>;

    if (response.statusCode >= 400) {
      throw ApiException(
        body['error'] as String? ?? 'Erreur reseau',
        response.statusCode,
      );
    }

    if (body['success'] != true) {
      throw ApiException('Reponse API invalide', response.statusCode);
    }

    return body['data'];
  }
}

class ApiException implements Exception {
  ApiException(this.message, [this.statusCode]);

  final String message;
  final int? statusCode;

  @override
  String toString() => message;
}
