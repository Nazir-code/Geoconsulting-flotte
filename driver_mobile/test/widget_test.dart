import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('smoke renders a MaterialApp', (WidgetTester tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: Text('Driver Mobile'),
        ),
      ),
    );

    expect(find.text('Driver Mobile'), findsOneWidget);
  });
}
