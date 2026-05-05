/**
 * Navigate on the root stack from deeply nested screens (e.g. Groups stack inside tabs).
 * @param merge When false, replaces screen params (avoids stale merged params e.g. presetGroupId).
 */
export function navigateRoot(
  navigation: { getParent?: () => unknown },
  name: string,
  params?: Record<string, unknown>,
  merge = true
): void {
  let nav: {
    navigate: (...args: unknown[]) => void;
    getParent?: () => unknown;
  } = navigation as { navigate: (...args: unknown[]) => void; getParent?: () => unknown };

  while (typeof nav.getParent === "function") {
    const next = nav.getParent() as typeof nav | undefined;
    if (!next) break;
    nav = next;
  }

  if (merge) {
    nav.navigate(name, params);
  } else {
    nav.navigate({ name, params: params ?? {}, merge: false });
  }
}
