import 'package:flutter/material.dart';

class AppSpacing {
  // ─── Base unit: 4px ───────────────────────────────────────────────────────
  static const double xs  = 4;
  static const double sm  = 8;
  static const double md  = 12;
  static const double lg  = 16;
  static const double xl  = 20;
  static const double xl2 = 24;
  static const double xl3 = 32;
  static const double xl4 = 40;
  static const double xl5 = 48;
  static const double xl6 = 64;

  // ─── Page padding ─────────────────────────────────────────────────────────
  static const EdgeInsets pagePadding =
      EdgeInsets.symmetric(horizontal: 20, vertical: 16);

  static const EdgeInsets pageHorizontal =
      EdgeInsets.symmetric(horizontal: 20);

  static const EdgeInsets sectionPadding =
      EdgeInsets.symmetric(horizontal: 20, vertical: 12);

  static const EdgeInsets cardPadding = EdgeInsets.all(16);

  static const EdgeInsets cardPaddingLg = EdgeInsets.all(20);

  // ─── Border radii ─────────────────────────────────────────────────────────
  static const double radiusXs  = 6;
  static const double radiusSm  = 8;
  static const double radiusMd  = 12;
  static const double radiusLg  = 16;
  static const double radiusXl  = 20;
  static const double radiusXl2 = 24;
  static const double radiusFull = 999;

  static BorderRadius get roundedXs  => BorderRadius.circular(radiusXs);
  static BorderRadius get roundedSm  => BorderRadius.circular(radiusSm);
  static BorderRadius get roundedMd  => BorderRadius.circular(radiusMd);
  static BorderRadius get roundedLg  => BorderRadius.circular(radiusLg);
  static BorderRadius get roundedXl  => BorderRadius.circular(radiusXl);
  static BorderRadius get roundedXl2 => BorderRadius.circular(radiusXl2);
  static BorderRadius get roundedFull => BorderRadius.circular(radiusFull);

  // ─── Icon sizes ───────────────────────────────────────────────────────────
  static const double iconXs  = 14;
  static const double iconSm  = 18;
  static const double iconMd  = 22;
  static const double iconLg  = 26;
  static const double iconXl  = 32;
  static const double iconXl2 = 40;
  static const double iconXl3 = 48;

  // ─── Avatar sizes ─────────────────────────────────────────────────────────
  static const double avatarSm = 32;
  static const double avatarMd = 40;
  static const double avatarLg = 56;
  static const double avatarXl = 80;

  // ─── Button heights ───────────────────────────────────────────────────────
  static const double btnHeightSm = 36;
  static const double btnHeightMd = 48;
  static const double btnHeightLg = 56;

  // ─── Card constraints ─────────────────────────────────────────────────────
  static const double cardMinHeight = 80;
  static const double cardMaxWidth  = 400;

  // ─── Bottom nav ───────────────────────────────────────────────────────────
  static const double bottomNavHeight = 64;

  // ─── AppBar ───────────────────────────────────────────────────────────────
  static const double appBarHeight = 60;
  static const double appBarHeightLg = 72;

  // ─── Divider ──────────────────────────────────────────────────────────────
  static const Widget dividerH = Divider(height: 1, thickness: 1);
  static const Widget dividerV = VerticalDivider(width: 1, thickness: 1);

  // ─── SizedBox shortcuts ───────────────────────────────────────────────────
  static const Widget gapXs  = SizedBox(height: xs);
  static const Widget gapSm  = SizedBox(height: sm);
  static const Widget gapMd  = SizedBox(height: md);
  static const Widget gapLg  = SizedBox(height: lg);
  static const Widget gapXl  = SizedBox(height: xl);
  static const Widget gapXl2 = SizedBox(height: xl2);
  static const Widget gapXl3 = SizedBox(height: xl3);
  static const Widget gapXl4 = SizedBox(height: xl4);

  static const Widget hGapXs  = SizedBox(width: xs);
  static const Widget hGapSm  = SizedBox(width: sm);
  static const Widget hGapMd  = SizedBox(width: md);
  static const Widget hGapLg  = SizedBox(width: lg);
  static const Widget hGapXl  = SizedBox(width: xl);
  static const Widget hGapXl2 = SizedBox(width: xl2);
}
