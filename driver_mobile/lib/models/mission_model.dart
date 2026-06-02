// lib/models/mission_model.dart
// Modèle pour les missions

import 'package:cloud_firestore/cloud_firestore.dart';

/// Modèle représentant une mission
class Mission {
  final String id;
  final String title;
  final String description;
  final String priority; // low, medium, high
  final String location;
  final String assignedTo; // UID du chauffeur
  final String status; // en_attente, assignée, en_cours, terminée, annulée
  final String createdBy; // UID du manager
  final Timestamp createdAt;
  final Timestamp? assignedAt;
  final Timestamp? completedAt;
  final Timestamp updatedAt;
  final List<String>? notes;

  Mission({
    required this.id,
    required this.title,
    required this.description,
    required this.priority,
    required this.location,
    required this.assignedTo,
    required this.status,
    required this.createdBy,
    required this.createdAt,
    this.assignedAt,
    this.completedAt,
    required this.updatedAt,
    this.notes,
  });

  /// Créer une mission depuis JSON (Firestore)
  factory Mission.fromJson(Map<String, dynamic> json) {
    return Mission(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      priority: json['priority'] ?? 'medium',
      location: json['location'] ?? '',
      assignedTo: json['assignedTo'] ?? '',
      status: _normalizeStatus(json['status'] as String?),
      createdBy: json['createdBy'] ?? '',
      createdAt: json['createdAt'] ?? Timestamp.now(),
      assignedAt: json['assignedAt'],
      completedAt: json['completedAt'],
      updatedAt: json['updatedAt'] ?? Timestamp.now(),
      notes: List<String>.from(json['notes'] ?? []),
    );
  }

  /// Convertir en JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'priority': priority,
      'location': location,
      'assignedTo': assignedTo,
      'status': status,
      'createdBy': createdBy,
      'createdAt': createdAt,
      'assignedAt': assignedAt,
      'completedAt': completedAt,
      'updatedAt': updatedAt,
      'notes': notes ?? [],
    };
  }

  /// Copier avec modifications
  Mission copyWith({
    String? id,
    String? title,
    String? description,
    String? priority,
    String? location,
    String? assignedTo,
    String? status,
    String? createdBy,
    Timestamp? createdAt,
    Timestamp? assignedAt,
    Timestamp? completedAt,
    Timestamp? updatedAt,
    List<String>? notes,
  }) {
    return Mission(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      priority: priority ?? this.priority,
      location: location ?? this.location,
      assignedTo: assignedTo ?? this.assignedTo,
      status: status ?? this.status,
      createdBy: createdBy ?? this.createdBy,
      createdAt: createdAt ?? this.createdAt,
      assignedAt: assignedAt ?? this.assignedAt,
      completedAt: completedAt ?? this.completedAt,
      updatedAt: updatedAt ?? this.updatedAt,
      notes: notes ?? this.notes,
    );
  }

  @override
  String toString() => 'Mission(id: $id, title: $title, status: $status)';

  static String _normalizeStatus(String? status) {
    switch (status) {
      case 'pending':
        return 'en_attente';
      case 'in_progress':
        return 'en_cours';
      case 'completed':
        return 'terminée';
      case 'cancelled':
        return 'annulée';
      default:
        return status ?? 'en_attente';
    }
  }
}
