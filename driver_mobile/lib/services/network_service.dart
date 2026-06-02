import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/material.dart';

enum NetworkStatus { online, offline }

class NetworkService extends ChangeNotifier {
  static final NetworkService _instance = NetworkService._internal();
  factory NetworkService() => _instance;

  final Connectivity _connectivity = Connectivity();
  NetworkStatus _status = NetworkStatus.online;
  StreamSubscription<List<ConnectivityResult>>? _subscription;

  NetworkService._internal() {
    _init();
  }

  NetworkStatus get status => _status;
  bool get isOnline => _status == NetworkStatus.online;

  Future<void> _init() async {
    final results = await _connectivity.checkConnectivity();
    _updateStatus(results);

    _subscription = _connectivity.onConnectivityChanged.listen(_updateStatus);
  }

  void _updateStatus(List<ConnectivityResult> results) {
    // Si l'une des connexions est active, on est online
    final hasConnection = results.any((result) => result != ConnectivityResult.none);

    final newStatus = hasConnection ? NetworkStatus.online : NetworkStatus.offline;

    if (_status != newStatus) {
      _status = newStatus;
      notifyListeners();
      debugPrint("🌐 [NetworkService] Statut changé: $_status");
    }
  }

  @override
  void dispose() {
    _subscription?.cancel();
    super.dispose();
  }
}
