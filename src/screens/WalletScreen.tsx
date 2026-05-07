import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, layout, radius, shadows, spacing, touch, typography } from "../constants/theme";
import { useDevnetSolBalance } from "../hooks/useDevnetSolBalance";
import { useProfile } from "../hooks/useProfile";
import { useSplits } from "../hooks/useSplits";
import { useWallet } from "../hooks/useWallet";
import { resolveCurrentUserParticipantId } from "../lib/currentUserParticipant";
import { formatUsd } from "../lib/formatMoney";
import { truncateWalletAddress } from "../lib/truncateWalletAddress";

function formatSolDisplay(sol: number): string {
  if (!Number.isFinite(sol)) return "—";
  const s = sol.toFixed(6).replace(/\.?0+$/, "");
  return s.length > 0 ? s : "0";
}

export function WalletScreen() {
  const { profile, loading: profileLoading, refreshProfile, updateProfile } = useProfile();
  const { connecting, disconnecting, walletError, clearWalletError, connect, disconnect } = useWallet(updateProfile);
  const { splits, loading: splitsLoading, refresh } = useSplits();
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [personFilter, setPersonFilter] = useState<string>("all");

  const connectedAddress = profile?.mockWalletAddress?.trim() ?? "";
  const isWalletConnected = connectedAddress.length > 0;
  const {
    solBalance,
    loading: solLoading,
    refreshing: solRefreshing,
    error: solError,
    refresh: refreshDevnetSol,
  } = useDevnetSolBalance(connectedAddress);

  useFocusEffect(
    useCallback(() => {
      refresh();
      refreshProfile();
      if (connectedAddress) {
        void refreshDevnetSol();
      }
    }, [refresh, refreshProfile, connectedAddress, refreshDevnetSol])
  );

  const groupOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const split of splits) {
      if (split.groupId) map.set(split.groupId, split.groupName || "Unnamed group");
      else map.set("direct", "Direct");
    }
    return [{ id: "all", label: "All groups" }, ...Array.from(map.entries()).map(([id, label]) => ({ id, label }))];
  }, [splits]);

  const personOptions = useMemo(() => {
    if (!profile) return [{ id: "all", label: "All people" }];
    const map = new Map<string, string>();
    for (const split of splits) {
      const me = resolveCurrentUserParticipantId(split.participants, profile);
      for (const p of split.participants) {
        if (p.id === me) continue;
        map.set(p.id, p.nickname);
      }
    }
    return [{ id: "all", label: "All people" }, ...Array.from(map.entries()).map(([id, label]) => ({ id, label }))];
  }, [splits, profile]);

  const filteredSplits = useMemo(() => {
    if (!profile) return [];
    return splits.filter((split) => {
      if (groupFilter !== "all") {
        if (groupFilter === "direct" && split.groupId) return false;
        if (groupFilter !== "direct" && split.groupId !== groupFilter) return false;
      }
      if (personFilter !== "all") {
        const me = resolveCurrentUserParticipantId(split.participants, profile);
        if (!split.participants.some((p) => p.id === personFilter && p.id !== me)) return false;
      }
      return true;
    });
  }, [splits, profile, groupFilter, personFilter]);

  const stats = useMemo(() => {
    if (!profile) {
      return { owed: 0, owe: 0, net: 0, pending: 0, active: 0, disputed: 0, settled: 0 };
    }
    let owed = 0;
    let owe = 0;
    let pending = 0;
    let active = 0;
    let disputed = 0;
    let settled = 0;
    for (const split of filteredSplits) {
      const me = resolveCurrentUserParticipantId(split.participants, profile);
      for (const balance of split.balances ?? []) {
        if (balance.settled || !me) continue;
        if (balance.to === me) owed += balance.amount;
        if (balance.from === me) owe += balance.amount;
      }
      if (split.status === "pending") pending += 1;
      if (split.status === "active") active += 1;
      if (split.status === "disputed") disputed += 1;
      if (split.status === "settled") settled += 1;
    }
    const roundedOwed = Math.round(owed * 100) / 100;
    const roundedOwe = Math.round(owe * 100) / 100;
    return {
      owed: roundedOwed,
      owe: roundedOwe,
      net: Math.round((roundedOwed - roundedOwe) * 100) / 100,
      pending,
      active,
      disputed,
      settled,
    };
  }, [filteredSplits, profile]);

  if (profileLoading || splitsLoading) {
    return (
      <SafeAreaView style={styles.centered} edges={["top"]}>
        <ActivityIndicator size="large" color={colors.accentStrong} accessibilityLabel="Loading wallet" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Wallet</Text>
        <Text style={styles.subtitle}>dashboard + local finance</Text>

        <View
          style={[
            styles.balanceCard,
            stats.net < 0 ? styles.balanceCardNegative : styles.balanceCardPositive,
          ]}
        >
          <View style={styles.balanceInner}>
            <Text style={styles.balanceLabel}>Local split balance (USD)</Text>
            <Text style={[styles.balanceBig, stats.net < 0 && styles.balanceBigNegative]}>
              {stats.net >= 0 ? `+ ${formatUsd(stats.net)}` : `- ${formatUsd(Math.abs(stats.net))}`}
            </Text>
            <View style={styles.balanceSplitRow}>
              <View style={styles.balanceSplitItem}>
                <Text style={styles.balanceSplitLabel}>Money owed to you</Text>
                <Text style={styles.balanceSplitValue}>+ {formatUsd(stats.owed)}</Text>
              </View>
              <View style={styles.balanceSplitItem}>
                <Text style={styles.balanceSplitLabel}>You owe</Text>
                <Text style={styles.balanceSplitValue}>- {formatUsd(stats.owe)}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.connectCard}>
          <Text style={styles.connectTitle}>{isWalletConnected ? "Wallet connected" : "Not connected yet"}</Text>
          <Text style={styles.muted}>
            Wallet status: {isWalletConnected ? "Connected · Solana devnet" : "Not connected"}
          </Text>
          {isWalletConnected ? (
            <Text style={styles.addressLine} selectable>
              {truncateWalletAddress(connectedAddress)}
            </Text>
          ) : null}
          {!isWalletConnected ? (
            <>
              <Text style={styles.muted}>Wallet balance: Coming in Phase 2</Text>
              <Text style={styles.muted}>Devnet SOL: connect a wallet to load from devnet.</Text>
            </>
          ) : (
            <View style={styles.solBlock}>
              <Text style={styles.muted}>Devnet SOL balance</Text>
              {solLoading && solBalance === null && !solError ? (
                <View style={styles.solLoadingRow}>
                  <ActivityIndicator size="small" color={colors.accentStrong} accessibilityLabel="Loading devnet balance" />
                  <Text style={styles.muted}>Loading balance…</Text>
                </View>
              ) : solError ? (
                <Text style={styles.errorText}>{solError}</Text>
              ) : solBalance !== null ? (
                <Text style={styles.solAmount}>{formatSolDisplay(solBalance)} SOL</Text>
              ) : null}
              <View style={styles.solActions}>
                <Pressable
                  style={[styles.refreshBtn, (solRefreshing || solLoading) && styles.btnDisabled]}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: solRefreshing || solLoading }}
                  disabled={solRefreshing || solLoading}
                  onPress={() => {
                    void refreshDevnetSol();
                  }}
                >
                  <Text style={styles.refreshBtnText}>{solRefreshing ? "Refreshing…" : "Refresh"}</Text>
                </Pressable>
              </View>
              <Text style={styles.faucetHelper}>
                Need test SOL? Use faucet.solana.com on Devnet, then tap Refresh.
              </Text>
            </View>
          )}
          {walletError ? <Text style={styles.errorText}>{walletError}</Text> : null}
          {isWalletConnected ? (
            <Pressable
              style={[styles.connectBtn, (connecting || disconnecting) && styles.btnDisabled]}
              accessibilityRole="button"
              accessibilityState={{ disabled: connecting || disconnecting }}
              disabled={connecting || disconnecting}
              onPress={() => {
                clearWalletError();
                void disconnect();
              }}
            >
              <Text style={styles.connectBtnText}>{disconnecting ? "Disconnecting…" : "Disconnect Wallet"}</Text>
            </Pressable>
          ) : (
            <Pressable
              style={[styles.connectBtn, (connecting || disconnecting) && styles.btnDisabled]}
              accessibilityRole="button"
              accessibilityState={{ disabled: connecting || disconnecting }}
              disabled={connecting || disconnecting}
              onPress={() => {
                clearWalletError();
                void (async () => {
                  const ok = await connect();
                  if (ok) void refreshDevnetSol();
                })();
              }}
            >
              <Text style={styles.connectBtnText}>{connecting ? "Connecting…" : "Connect Wallet"}</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>On-chain payments</Text>
          <Text style={styles.sectionSub}>Solana (placeholder)</Text>
          <Text style={styles.muted}>on-chain payments + history are coming in Phase 2</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionSub}>Filter by group</Text>
          <View style={styles.chips}>
            {groupOptions.map((opt) => (
              <Pressable key={opt.id} style={[styles.chip, groupFilter === opt.id && styles.chipSelected]} onPress={() => setGroupFilter(opt.id)}>
                <Text style={[styles.chipText, groupFilter === opt.id && styles.chipTextSelected]}>{opt.label}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.sectionSub}>Filter by person</Text>
          <View style={styles.chips}>
            {personOptions.map((opt) => (
              <Pressable key={opt.id} style={[styles.chip, personFilter === opt.id && styles.chipSelected]} onPress={() => setPersonFilter(opt.id)}>
                <Text style={[styles.chipText, personFilter === opt.id && styles.chipTextSelected]}>{opt.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" },
  scroll: {
    paddingHorizontal: layout.screenPaddingH,
    paddingTop: layout.screenPaddingV,
    gap: layout.block,
    paddingBottom: layout.scrollBottom,
  },
  title: { ...typography.screenTitle },
  subtitle: { ...typography.caption, color: colors.textMuted, marginTop: -layout.titleGap, fontStyle: "italic" },
  balanceCard: {
    borderRadius: radius.xl,
    padding: layout.cardPadding,
    ...shadows.card,
  },
  balanceCardPositive: {
    backgroundColor: colors.success,
  },
  balanceCardNegative: {
    backgroundColor: colors.warning,
  },
  balanceInner: {
    gap: layout.stack,
  },
  balanceLabel: {
    ...typography.caption,
    color: colors.background,
    fontStyle: "italic",
  },
  balanceBig: {
    ...typography.heading,
    color: colors.background,
    fontSize: 34,
    fontWeight: "500",
  },
  balanceBigNegative: {
    color: colors.background,
  },
  balanceSplitRow: {
    flexDirection: "row",
    gap: layout.section,
  },
  balanceSplitItem: {
    gap: layout.titleGap,
  },
  balanceSplitLabel: {
    ...typography.caption,
    color: "rgba(7,19,17,0.7)",
    fontStyle: "italic",
  },
  balanceSplitValue: {
    ...typography.heading,
    color: colors.background,
    fontWeight: "500",
    fontSize: 22,
  },
  connectCard: {
    marginTop: 0,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    borderRadius: radius.xl,
    padding: layout.cardPadding,
    gap: layout.inline,
    ...shadows.cardSubtle,
  },
  connectTitle: { ...typography.heading, fontSize: 34, fontWeight: "500" },
  connectBtn: {
    marginTop: layout.stack,
    minHeight: touch.minHeight,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  connectBtnText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
  },
  btnDisabled: { opacity: 0.55 },
  addressLine: {
    ...typography.body,
    color: colors.text,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    lineHeight: 18,
  },
  solBlock: {
    gap: layout.inline,
  },
  solLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  solAmount: {
    ...typography.body,
    color: colors.text,
    fontWeight: "700",
    fontSize: 20,
  },
  solActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  refreshBtn: {
    alignSelf: "flex-start",
    minHeight: touch.minHeight - 10,
    paddingHorizontal: layout.cardPaddingDense,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderStyle: "dashed",
    backgroundColor: colors.surfaceElevated,
    justifyContent: "center",
  },
  refreshBtnText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: "700",
    fontSize: 12,
  },
  faucetHelper: {
    ...typography.caption,
    color: colors.textDim,
    lineHeight: 18,
    marginTop: layout.titleGap,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    borderRadius: radius.lg,
    padding: layout.cardPadding,
    gap: layout.stack,
    ...shadows.cardSubtle,
  },
  sectionTitle: { ...typography.heading, fontSize: 32, fontWeight: "500", marginTop: layout.titleGap },
  sectionSub: { ...typography.overline, fontSize: 10 },
  muted: { ...typography.caption, color: colors.textMuted, lineHeight: 18 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: layout.inline },
  chip: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderStyle: "dashed",
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceElevated,
    minHeight: touch.minHeight - 8,
    paddingHorizontal: layout.cardPaddingDense,
    justifyContent: "center",
  },
  chipSelected: { borderColor: colors.accentStrong, backgroundColor: colors.primaryMuted },
  chipText: { ...typography.caption, color: colors.text, fontSize: 12, fontWeight: "600" },
  chipTextSelected: { color: colors.accentStrong },
});
