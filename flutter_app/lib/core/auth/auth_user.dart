final class AuthUser {
  const AuthUser.guest() : id = null, isAnonymous = false;

  factory AuthUser.session({required String id, required bool isAnonymous}) {
    final normalizedId = id.trim();
    if (normalizedId.isEmpty) {
      throw ArgumentError.value(id, 'id', 'A session user id cannot be empty.');
    }

    return AuthUser._(id: normalizedId, isAnonymous: isAnonymous);
  }

  const AuthUser._({required this.id, required this.isAnonymous});

  final String? id;
  final bool isAnonymous;

  bool get isGuest => id == null;
}
