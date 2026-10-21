import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useSyncExternalStore } from 'react';
import { Linking, NativeModules, Platform } from 'react-native';
import Purchases, { type CustomerInfo, type PurchasesPackage } from 'react-native-purchases';

// 구독은 애플·구글 인앱결제를 RevenueCat으로 처리합니다.
// 개발용 빌드에 RevenueCat 키가 들어 있을 때만 실제 결제를 쓰고,
// Expo Go·웹·키가 없는 빌드에서는 기기 안에서만 흉내 내는 테스트 모드로 동작합니다.

/** RevenueCat 대시보드에서 만든 권한(entitlement) 이름 */
export const ENTITLEMENT = 'premium';
export const TRIAL_DAYS = 7;

export type PlanId = 'monthly' | 'annual';

/** 스토어 가격을 못 불러왔을 때 보여줄 기본 가격. 실제 결제 금액은 스토어에 등록한 값입니다. */
export const PLANS: Record<PlanId, { label: string; price: number; period: string }> = {
  monthly: { label: '월간', price: 4900, period: '월' },
  annual: { label: '연간', price: 39000, period: '년' },
};

export const formatWon = (n: number) => `${n.toLocaleString('ko-KR')}원`;
/** 연간 요금을 월로 나눈 금액과 월간 대비 할인율 */
export const ANNUAL_PER_MONTH = Math.round(PLANS.annual.price / 12 / 10) * 10;
export const ANNUAL_DISCOUNT = Math.round((1 - PLANS.annual.price / (PLANS.monthly.price * 12)) * 100);

export type SubscriptionState = {
  ready: boolean;
  testMode: boolean;
  isPremium: boolean;
  plan: PlanId | null;
  inTrial: boolean;
  willRenew: boolean;
  expiresAt: string | null;
  /** 스토어에 등록된 지역 가격 문자열 (실제 결제 모드에서만) */
  priceStrings: Partial<Record<PlanId, string>>;
};

const API_KEY = Platform.select({
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
});
const TEST_MODE = !API_KEY || !NativeModules.RNPurchases;

const MOCK_KEY = 'subscription/test-mode/v1';
type MockRecord = { plan: PlanId; startedAt: string; trialEndsAt: string; expiresAt: string; cancelled: boolean };

let state: SubscriptionState = {
  ready: false,
  testMode: TEST_MODE,
  isPremium: false,
  plan: null,
  inTrial: false,
  willRenew: false,
  expiresAt: null,
  priceStrings: {},
};
let packages: Partial<Record<PlanId, PurchasesPackage>> = {};
let init: Promise<void> | null = null;
const listeners = new Set<() => void>();

function setState(patch: Partial<SubscriptionState>) {
  state = { ...state, ...patch };
  for (const l of listeners) l();
}

function fromCustomerInfo(info: CustomerInfo): Partial<SubscriptionState> {
  const ent = info.entitlements.active[ENTITLEMENT];
  if (!ent) return { isPremium: false, plan: null, inTrial: false, willRenew: false, expiresAt: null };
  const plan: PlanId = /year|annual/i.test(ent.productIdentifier) ? 'annual' : 'monthly';
  return {
    isPremium: true,
    plan,
    inTrial: ent.periodType.toUpperCase() === 'TRIAL',
    willRenew: ent.willRenew,
    expiresAt: ent.expirationDate,
  };
}

function fromMock(rec: MockRecord | null): Partial<SubscriptionState> {
  if (!rec) return { isPremium: false, plan: null, inTrial: false, willRenew: false, expiresAt: null };
  const now = Date.now();
  const active = now < Date.parse(rec.expiresAt);
  return {
    isPremium: active,
    plan: active ? rec.plan : null,
    inTrial: active && now < Date.parse(rec.trialEndsAt),
    willRenew: active && !rec.cancelled,
    expiresAt: active ? rec.expiresAt : null,
  };
}

async function readMock(): Promise<MockRecord | null> {
  try {
    const raw = await AsyncStorage.getItem(MOCK_KEY);
    return raw ? (JSON.parse(raw) as MockRecord) : null;
  } catch {
    return null;
  }
}

function initialize() {
  init ??= (async () => {
    if (TEST_MODE) {
      setState({ ...fromMock(await readMock()), ready: true });
      return;
    }
    try {
      Purchases.configure({ apiKey: API_KEY! });
      Purchases.addCustomerInfoUpdateListener((info) => setState(fromCustomerInfo(info)));
      const [info, offerings] = await Promise.all([Purchases.getCustomerInfo(), Purchases.getOfferings()]);
      const current = offerings.current;
      packages = { monthly: current?.monthly ?? undefined, annual: current?.annual ?? undefined };
      setState({
        ...fromCustomerInfo(info),
        priceStrings: {
          monthly: packages.monthly?.product.priceString,
          annual: packages.annual?.product.priceString,
        },
      });
    } catch {
      // 네트워크 문제 등으로 못 불러오면 무료 상태로 두고, 결제 시도할 때 다시 알려줍니다.
    } finally {
      setState({ ready: true });
    }
  })();
  return init;
}

export class PurchaseCancelled extends Error {}

/** 구독을 시작합니다. 취소하면 PurchaseCancelled를 던집니다. */
export async function purchase(plan: PlanId) {
  await initialize();
  if (TEST_MODE) {
    const now = Date.now();
    const trialEndsAt = now + TRIAL_DAYS * 86400000;
    const rec: MockRecord = {
      plan,
      startedAt: new Date(now).toISOString(),
      trialEndsAt: new Date(trialEndsAt).toISOString(),
      expiresAt: new Date(trialEndsAt).toISOString(),
      cancelled: false,
    };
    await AsyncStorage.setItem(MOCK_KEY, JSON.stringify(rec));
    setState(fromMock(rec));
    return;
  }
  const pkg = packages[plan];
  if (!pkg) throw new Error('구독 상품을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.');
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    setState(fromCustomerInfo(customerInfo));
  } catch (e) {
    if ((e as { userCancelled?: boolean }).userCancelled) throw new PurchaseCancelled();
    throw e;
  }
}

/** 다른 기기나 재설치 후 구독을 되찾습니다. 프리미엄이 복원됐으면 true. */
export async function restore(): Promise<boolean> {
  await initialize();
  if (TEST_MODE) {
    setState(fromMock(await readMock()));
    return state.isPremium;
  }
  const info = await Purchases.restorePurchases();
  setState(fromCustomerInfo(info));
  return state.isPremium;
}

/** 구독 해지·변경은 스토어의 구독 관리 화면에서 합니다. */
export async function manageSubscription() {
  if (TEST_MODE) {
    const rec = await readMock();
    if (rec) {
      const next = { ...rec, cancelled: true };
      await AsyncStorage.setItem(MOCK_KEY, JSON.stringify(next));
      setState(fromMock(next));
    }
    return;
  }
  try {
    await Purchases.showManageSubscriptions();
  } catch {
    await Linking.openURL(
      Platform.OS === 'ios'
        ? 'https://apps.apple.com/account/subscriptions'
        : 'https://play.google.com/store/account/subscriptions',
    );
  }
}

/** 테스트 모드에서 구독 기록을 지워 처음 상태로 돌립니다. */
export async function resetTestSubscription() {
  if (!TEST_MODE) return;
  await AsyncStorage.removeItem(MOCK_KEY);
  setState(fromMock(null));
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
const getState = () => state;

export function useSubscription() {
  useEffect(() => {
    initialize();
  }, []);
  return useSyncExternalStore(subscribe, getState, getState);
}
