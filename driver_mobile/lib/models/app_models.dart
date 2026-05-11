class AuthSession {
  const AuthSession({
    required this.token,
    required this.user,
    required this.driver,
  });

  final String token;
  final User user;
  final Driver driver;

  factory AuthSession.fromJson(Map<String, dynamic> json) {
    return AuthSession(
      token: json['token'] as String,
      user: User.fromJson(json['user'] as Map<String, dynamic>),
      driver: Driver.fromJson(json['driver'] as Map<String, dynamic>),
    );
  }
}

class User {
  const User({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    required this.role,
    this.phone,
    this.avatar,
  });

  final String id;
  final String email;
  final String firstName;
  final String lastName;
  final String role;
  final String? phone;
  final String? avatar;

  String get fullName => '$firstName $lastName';

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      email: json['email'] as String,
      firstName: json['firstName'] as String,
      lastName: json['lastName'] as String,
      role: json['role'] as String,
      phone: json['phone'] as String?,
      avatar: json['avatar'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'firstName': firstName,
        'lastName': lastName,
        'role': role,
        'phone': phone,
        'avatar': avatar,
      };
}

class Driver {
  const Driver({
    required this.id,
    required this.userId,
    required this.licenseNumber,
    required this.licenseExpiry,
    required this.status,
    required this.rating,
    required this.totalMissions,
    required this.user,
    this.currentVehicleId,
    this.currentVehicle,
  });

  final String id;
  final String userId;
  final String licenseNumber;
  final DateTime licenseExpiry;
  final String status;
  final double rating;
  final int totalMissions;
  final User user;
  final String? currentVehicleId;
  final Vehicle? currentVehicle;

  factory Driver.fromJson(Map<String, dynamic> json) {
    return Driver(
      id: json['id'] as String,
      userId: json['userId'] as String,
      licenseNumber: json['licenseNumber'] as String,
      licenseExpiry: DateTime.parse(json['licenseExpiry'] as String),
      status: json['status'] as String,
      rating: (json['rating'] as num).toDouble(),
      totalMissions: (json['totalMissions'] as num).toInt(),
      user: User.fromJson(json['user'] as Map<String, dynamic>),
      currentVehicleId: json['currentVehicleId'] as String?,
      currentVehicle: json['currentVehicle'] == null
          ? null
          : Vehicle.fromJson(json['currentVehicle'] as Map<String, dynamic>),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'userId': userId,
        'licenseNumber': licenseNumber,
        'licenseExpiry': licenseExpiry.toIso8601String(),
        'status': status,
        'rating': rating,
        'totalMissions': totalMissions,
        'user': user.toJson(),
        'currentVehicleId': currentVehicleId,
        'currentVehicle': currentVehicle?.toJson(),
      };
}

class Vehicle {
  const Vehicle({
    required this.id,
    required this.plateNumber,
    required this.model,
    required this.brand,
    required this.year,
    required this.type,
    required this.status,
    required this.fuelType,
    required this.mileage,
    this.fuelCapacity,
    this.image,
  });

  final String id;
  final String plateNumber;
  final String model;
  final String brand;
  final int year;
  final String type;
  final String status;
  final String fuelType;
  final int mileage;
  final num? fuelCapacity;
  final String? image;

  String get displayName => '$brand $model';

  factory Vehicle.fromJson(Map<String, dynamic> json) {
    return Vehicle(
      id: json['id'] as String,
      plateNumber: json['plateNumber'] as String,
      model: json['model'] as String,
      brand: json['brand'] as String,
      year: (json['year'] as num).toInt(),
      type: json['type'] as String,
      status: json['status'] as String,
      fuelType: json['fuelType'] as String,
      mileage: (json['mileage'] as num).toInt(),
      fuelCapacity: json['fuelCapacity'] as num?,
      image: json['image'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'plateNumber': plateNumber,
        'model': model,
        'brand': brand,
        'year': year,
        'type': type,
        'status': status,
        'fuelType': fuelType,
        'mileage': mileage,
        'fuelCapacity': fuelCapacity,
        'image': image,
      };
}

class Mission {
  const Mission({
    required this.id,
    required this.destination,
    required this.purpose,
    required this.startTime,
    required this.status,
    required this.vehicle,
    required this.driver,
    this.startLocation,
    this.endLocation,
    this.endTime,
    this.distance,
    this.fuelConsumed,
    this.notes,
  });

  final String id;
  final String destination;
  final String purpose;
  final DateTime startTime;
  final String status;
  final Vehicle vehicle;
  final Driver driver;
  final String? startLocation;
  final String? endLocation;
  final DateTime? endTime;
  final num? distance;
  final num? fuelConsumed;
  final String? notes;

  bool get isActive => status == 'in_progress';

  factory Mission.fromJson(Map<String, dynamic> json) {
    return Mission(
      id: json['id'] as String,
      destination: json['destination'] as String,
      purpose: json['purpose'] as String,
      startTime: DateTime.parse(json['startTime'] as String),
      status: json['status'] as String,
      vehicle: Vehicle.fromJson(json['vehicle'] as Map<String, dynamic>),
      driver: Driver.fromJson(json['driver'] as Map<String, dynamic>),
      startLocation: json['startLocation'] as String?,
      endLocation: json['endLocation'] as String?,
      endTime: json['endTime'] == null
          ? null
          : DateTime.parse(json['endTime'] as String),
      distance: json['distance'] as num?,
      fuelConsumed: json['fuelConsumed'] as num?,
      notes: json['notes'] as String?,
    );
  }
}

class FuelRecord {
  const FuelRecord({
    required this.id,
    required this.date,
    required this.quantity,
    required this.pricePerLiter,
    required this.totalCost,
    required this.mileage,
    required this.vehicle,
    this.station,
  });

  final String id;
  final DateTime date;
  final num quantity;
  final num pricePerLiter;
  final num totalCost;
  final num mileage;
  final Vehicle vehicle;
  final String? station;

  factory FuelRecord.fromJson(Map<String, dynamic> json) {
    return FuelRecord(
      id: json['id'] as String,
      date: DateTime.parse(json['date'] as String),
      quantity: json['quantity'] as num,
      pricePerLiter: json['pricePerLiter'] as num,
      totalCost: json['totalCost'] as num,
      mileage: json['mileage'] as num,
      vehicle: Vehicle.fromJson(json['vehicle'] as Map<String, dynamic>),
      station: json['station'] as String?,
    );
  }
}

class GpsPosition {
  const GpsPosition({
    required this.vehicleId,
    required this.lat,
    required this.lng,
    required this.speed,
    required this.progress,
    required this.eta,
  });

  final String vehicleId;
  final double lat;
  final double lng;
  final int speed;
  final double progress;
  final int eta;

  factory GpsPosition.fromJson(Map<String, dynamic> json) {
    return GpsPosition(
      vehicleId: json['vehicleId'] as String,
      lat: (json['lat'] as num).toDouble(),
      lng: (json['lng'] as num).toDouble(),
      speed: (json['speed'] as num).round(),
      progress: (json['progress'] as num).toDouble(),
      eta: (json['eta'] as num).round(),
    );
  }
}

class DriverDashboardData {
  const DriverDashboardData({
    required this.driver,
    required this.vehicle,
    required this.missions,
    required this.activeMission,
    required this.fuelRecords,
    required this.gpsPosition,
  });

  final Driver driver;
  final Vehicle? vehicle;
  final List<Mission> missions;
  final Mission? activeMission;
  final List<FuelRecord> fuelRecords;
  final GpsPosition? gpsPosition;
}
