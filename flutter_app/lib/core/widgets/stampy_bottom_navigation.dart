import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:stampy/app/theme/app_colors.dart';

class StampyBottomNavigation extends StatelessWidget {
  const StampyBottomNavigation({
    required this.selectedIndex,
    required this.onDestinationSelected,
    super.key,
  });

  final int selectedIndex;
  final ValueChanged<int> onDestinationSelected;

  static const _destinations = [
    _Destination('홈', Icons.home_outlined, Icons.home),
    _Destination('지도', Icons.map_outlined, Icons.map),
    _Destination('도장', Icons.adjust_outlined, Icons.adjust),
    _Destination('랭킹', Icons.leaderboard_outlined, Icons.leaderboard),
    _Destination('마이', Icons.person_outline, Icons.person),
  ];

  @override
  Widget build(BuildContext context) {
    final scaledLabelSize = MediaQuery.textScalerOf(context).scale(10);
    final navigationHeight = (64 + (scaledLabelSize - 10).clamp(0, 12))
        .toDouble();

    return DecoratedBox(
      decoration: const BoxDecoration(
        color: StampyColors.paper,
        border: Border(top: BorderSide(color: StampyColors.hairline)),
      ),
      child: SafeArea(
        top: false,
        child: SizedBox(
          height: navigationHeight,
          child: Row(
            children: [
              for (var index = 0; index < _destinations.length; index++)
                Expanded(
                  child: _NavigationItem(
                    destination: _destinations[index],
                    selected: selectedIndex == index,
                    onTap: () {
                      HapticFeedback.selectionClick();
                      onDestinationSelected(index);
                    },
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NavigationItem extends StatelessWidget {
  const _NavigationItem({
    required this.destination,
    required this.selected,
    required this.onTap,
  });

  final _Destination destination;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = selected ? StampyColors.accent : StampyColors.mutedInk;

    return Semantics(
      button: true,
      selected: selected,
      label: '${destination.label} 탭',
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          child: Stack(
            alignment: Alignment.center,
            children: [
              if (selected)
                const Positioned(
                  top: 0,
                  child: SizedBox(
                    width: 22,
                    child: Divider(color: StampyColors.accent, thickness: 2),
                  ),
                ),
              Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    selected ? destination.selectedIcon : destination.icon,
                    color: color,
                    size: 22,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    destination.label,
                    style: Theme.of(context).textTheme.labelMedium?.copyWith(
                      color: color,
                      fontSize: 10,
                      letterSpacing: 0,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Destination {
  const _Destination(this.label, this.icon, this.selectedIcon);

  final String label;
  final IconData icon;
  final IconData selectedIcon;
}
