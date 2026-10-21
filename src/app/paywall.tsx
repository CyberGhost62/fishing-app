import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { type ComponentProps, useState } from 'react';
import { Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/ui';
import { formatDate } from '../lib/format';
import {
  ANNUAL_DISCOUNT,
  ANNUAL_PER_MONTH,
  formatWon,
  manageSubscription,
  PLANS,
  purchase,
  PurchaseCancelled,
  type PlanId,
  resetTestSubscription,
  restore,
  TRIAL_DAYS,
  useSubscription,
} from '../lib/subscription';
import { colors } from '../theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

// 아직 만들지 않은 기능은 '준비 중'으로 분명히 표시합니다.
const BENEFITS: { icon: IconName; title: string; body: string; soon?: boolean }[] = [
  { icon: 'scan-outline', title: 'AI 사진 식별', body: '사진만 찍으면 어떤 물고기인지 후보를 알려줘요.', soon: true },
  { icon: 'stats-chart-outline', title: '조과 통계', body: '월별 조과, 어종별 최대어, 자주 가는 포인트를 한눈에.', soon: true },
  { icon: 'cloud-upload-outline', title: '기록 백업', body: '휴대폰을 바꿔도 기록과 사진을 그대로 옮겨요.', soon: true },
  { icon: 'water-outline', title: '물때·날씨 자동 기록', body: '잡은 순간의 물때와 날씨를 함께 남겨요.', soon: true },
];

const TERMS_URL = process.env.EXPO_PUBLIC_TERMS_URL;
const PRIVACY_URL = process.env.EXPO_PUBLIC_PRIVACY_URL;
const STORE = Platform.OS === 'ios' ? 'App Store' : 'Google Play';

export default function PaywallScreen() {
  const sub = useSubscription();
  const [plan, setPlan] = useState<PlanId>('annual');
  const [busy, setBusy] = useState(false);

  const priceOf = (p: PlanId) => sub.priceStrings[p] ?? formatWon(PLANS[p].price);

  async function start() {
    setBusy(true);
    try {
      await purchase(plan);
      router.back();
    } catch (e) {
      if (!(e instanceof PurchaseCancelled)) {
        Alert.alert('결제하지 못했어요', e instanceof Error ? e.message : '잠시 후 다시 시도해 주세요.');
      }
    } finally {
      setBusy(false);
    }
  }

  async function onRestore() {
    setBusy(true);
    try {
      const ok = await restore();
      Alert.alert(ok ? '구독을 복원했어요' : '복원할 구독이 없어요', ok ? '프리미엄을 계속 이용할 수 있어요.' : `이 ${STORE} 계정으로 구독한 기록이 없어요.`);
    } catch (e) {
      Alert.alert('복원하지 못했어요', e instanceof Error ? e.message : '잠시 후 다시 시도해 주세요.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.body}>
      {sub.testMode ? (
        <View style={styles.testBanner}>
          <Ionicons name="construct-outline" size={16} color={colors.warn} />
          <Text style={styles.testText}>테스트 모드: 실제로 결제되지 않아요. 결제는 스토어용 빌드에서만 돼요.</Text>
        </View>
      ) : null}

      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>🐟</Text>
        <Text style={styles.title}>물고기 도감 프리미엄</Text>
        <Text style={styles.lead}>기록·도감·지도는 지금처럼 무료예요. 프리미엄은 더 똑똑한 기능을 더해요.</Text>
      </View>

      <View style={styles.benefits}>
        {BENEFITS.map((b) => (
          <View key={b.title} style={styles.benefit}>
            <Ionicons name={b.icon} size={22} color={colors.primary} />
            <View style={{ flex: 1, gap: 2 }}>
              <View style={styles.benefitHead}>
                <Text style={styles.benefitTitle}>{b.title}</Text>
                {b.soon ? <Text style={styles.soon}>준비 중</Text> : null}
              </View>
              <Text style={styles.benefitBody}>{b.body}</Text>
            </View>
          </View>
        ))}
      </View>

      {sub.isPremium ? (
        <View style={styles.status}>
          <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.statusTitle}>
              프리미엄 이용 중 · {sub.plan ? PLANS[sub.plan].label : ''}
              {sub.inTrial ? ' (무료 체험)' : ''}
            </Text>
            {sub.expiresAt ? (
              <Text style={styles.statusBody}>
                {sub.willRenew
                  ? `${formatDate(sub.expiresAt)}에 ${sub.inTrial ? '첫 결제' : '자동 갱신'}돼요.`
                  : `${formatDate(sub.expiresAt)}까지 이용할 수 있어요. 해지됨.`}
              </Text>
            ) : null}
          </View>
        </View>
      ) : (
        <>
          <View style={styles.plans}>
            <PlanCard
              on={plan === 'annual'}
              onPress={() => setPlan('annual')}
              title="연간"
              price={`${priceOf('annual')} / 년`}
              sub={`월 ${formatWon(ANNUAL_PER_MONTH)}꼴`}
              badge={`${ANNUAL_DISCOUNT}% 할인`}
            />
            <PlanCard
              on={plan === 'monthly'}
              onPress={() => setPlan('monthly')}
              title="월간"
              price={`${priceOf('monthly')} / 월`}
              sub="언제든 해지"
            />
          </View>
          <Button label={busy ? '처리하는 중…' : `${TRIAL_DAYS}일 무료로 시작하기`} onPress={start} disabled={busy || !sub.ready} />
          <Text style={styles.fine}>
            {TRIAL_DAYS}일 무료 체험이 끝나면 {priceOf(plan)}이 {plan === 'annual' ? '1년' : '1개월'}마다 자동으로 결제돼요. 체험이나 구독 기간이
            끝나기 24시간 전까지 {STORE} 구독 관리에서 해지하면 다음 결제가 되지 않아요. 무료 체험은 계정당 한 번만 받을 수 있어요.
          </Text>
        </>
      )}

      <View style={styles.links}>
        {sub.isPremium ? (
          <Pressable onPress={manageSubscription} accessibilityRole="button" hitSlop={8}>
            <Text style={styles.link}>{sub.testMode ? '해지하기 (테스트)' : '구독 관리·해지'}</Text>
          </Pressable>
        ) : null}
        <Pressable onPress={onRestore} disabled={busy} accessibilityRole="button" hitSlop={8}>
          <Text style={styles.link}>구매 복원</Text>
        </Pressable>
        {TERMS_URL ? (
          <Pressable onPress={() => Linking.openURL(TERMS_URL)} accessibilityRole="link" hitSlop={8}>
            <Text style={styles.link}>이용약관</Text>
          </Pressable>
        ) : null}
        {PRIVACY_URL ? (
          <Pressable onPress={() => Linking.openURL(PRIVACY_URL)} accessibilityRole="link" hitSlop={8}>
            <Text style={styles.link}>개인정보처리방침</Text>
          </Pressable>
        ) : null}
        {sub.testMode && sub.isPremium ? (
          <Pressable onPress={resetTestSubscription} accessibilityRole="button" hitSlop={8}>
            <Text style={styles.link}>테스트 구독 지우기</Text>
          </Pressable>
        ) : null}
      </View>
    </ScrollView>
  );
}

function PlanCard({
  on,
  onPress,
  title,
  price,
  sub,
  badge,
}: {
  on: boolean;
  onPress: () => void;
  title: string;
  price: string;
  sub: string;
  badge?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.plan, on && styles.planOn]}
      accessibilityRole="radio"
      accessibilityState={{ selected: on }}
    >
      <Ionicons name={on ? 'radio-button-on' : 'radio-button-off'} size={22} color={on ? colors.primary : colors.muted} />
      <View style={{ flex: 1, gap: 2 }}>
        <View style={styles.planHead}>
          <Text style={styles.planTitle}>{title}</Text>
          {badge ? <Text style={styles.badge}>{badge}</Text> : null}
        </View>
        <Text style={styles.planSub}>{sub}</Text>
      </View>
      <Text style={styles.planPrice}>{price}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: { padding: 20, gap: 16, paddingBottom: 40 },
  testBanner: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: colors.warnBg, borderRadius: 10, padding: 10 },
  testText: { flex: 1, color: colors.warn, fontSize: 13, lineHeight: 18 },
  hero: { alignItems: 'center', gap: 6 },
  heroEmoji: { fontSize: 44 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  lead: { fontSize: 15, color: colors.muted, textAlign: 'center', lineHeight: 22 },
  benefits: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 14,
  },
  benefit: { flexDirection: 'row', gap: 12 },
  benefitHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  benefitTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  benefitBody: { fontSize: 13, color: colors.muted, lineHeight: 19 },
  soon: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
    backgroundColor: colors.bg,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    overflow: 'hidden',
  },
  plans: { gap: 10 },
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: 16,
  },
  planOn: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  planHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  planTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  badge: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primaryText,
    backgroundColor: colors.primary,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  planSub: { fontSize: 13, color: colors.muted },
  planPrice: { fontSize: 15, fontWeight: '700', color: colors.text },
  fine: { fontSize: 12, color: colors.muted, lineHeight: 18, textAlign: 'center' },
  status: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 14,
    padding: 16,
  },
  statusTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  statusBody: { fontSize: 13, color: colors.muted },
  links: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16 },
  link: { fontSize: 13, color: colors.primary, fontWeight: '600' },
});
