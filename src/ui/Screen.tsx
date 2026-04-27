import { ScrollView, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { type ReactNode } from 'react';
import MaskedView from '@react-native-masked-view/masked-view';
import { Canvas, LinearGradient, Rect, vec } from '@shopify/react-native-skia';
import { PaperBackground } from './PaperBackground';
import { useTheme } from '@/theme/useTheme';

const FADE_HEIGHT = 22;

export function Screen({
  children,
  scroll = true,
  padded = true,
  topInset = true,
  stickyTop,
  modalHandle = false,
}: {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  /**
   * Whether to add the top safe-area inset. Defaults to true (correct for
   * tab screens that have no header). Set to false on screens rendered
   * under a Stack header — the header already consumes the top inset, so
   * adding it again leaves a blank band under the header.
   */
  topInset?: boolean;
  /**
   * Optional element rendered above the scrollable content, inside the safe
   * area but outside the fade mask. Used for always-visible bars (e.g.
   * Today's quick-log bar). Content scrolls underneath and fades into it.
   */
  stickyTop?: ReactNode;
  /**
   * Render a small drag-handle bar at the very top. Used on screens that are
   * shown with `presentation: 'modal'` so the slide-down-to-dismiss gesture
   * is obvious. iOS pageSheet already supports the gesture natively; the
   * handle is a visual affordance to match the Quick-log modal's language.
   */
  modalHandle?: boolean;
}) {
  const { palette } = useTheme();
  const padCls = padded ? 'px-5' : '';
  const edges = topInset ? (['top'] as const) : ([] as const);
  // With a sticky bar, the bar already provides visual separation — tighten
  // the scrollview top padding so the first card doesn't float too far below.
  const topPadCls = stickyTop
    ? 'pt-4'
    : modalHandle
      ? 'pt-2'
      : topInset
        ? 'pt-6'
        : 'pt-3';
  return (
    <View className="flex-1 bg-bg">
      <PaperBackground />
      <SafeAreaView className="flex-1" edges={edges}>
        {modalHandle && (
          <View className="items-center pt-2 pb-1">
            <View
              className="rounded-full"
              style={{ width: 40, height: 5, backgroundColor: palette.ink + '30' }}
            />
          </View>
        )}
        {stickyTop}
        {scroll ? (
          <FadeTop>
            <ScrollView
              className="flex-1"
              contentContainerClassName={`${padCls} pb-16 ${topPadCls} gap-5`}
              showsVerticalScrollIndicator={false}
              // iOS: insets the scroll view when the keyboard appears AND
              // auto-scrolls to keep the focused input visible. No-op on
              // Android, which handles it via the manifest's adjustResize.
              automaticallyAdjustKeyboardInsets
              // Without this, the first tap on a button while the keyboard
              // is up gets eaten just to dismiss the keyboard. "handled"
              // lets buttons fire on the first tap; a tap on empty
              // background still dismisses.
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </ScrollView>
          </FadeTop>
        ) : (
          <View className={`flex-1 ${padCls} ${topPadCls} gap-5`}>{children}</View>
        )}
      </SafeAreaView>
    </View>
  );
}

/**
 * Applies an alpha mask so the top FADE_HEIGHT px of the wrapped content
 * fades from transparent → opaque. Content scrolling up dissolves into
 * whatever is rendered behind (the PaperBackground), with no overlay color.
 */
function FadeTop({ children }: { children: ReactNode }) {
  const { width, height } = useWindowDimensions();
  return (
    <MaskedView
      style={{ flex: 1 }}
      maskElement={
        <Canvas style={{ width, height, backgroundColor: 'transparent' }}>
          <Rect x={0} y={0} width={width} height={height}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(0, FADE_HEIGHT)}
              colors={['rgba(0,0,0,0)', 'rgba(0,0,0,1)']}
            />
          </Rect>
        </Canvas>
      }
    >
      {children}
    </MaskedView>
  );
}
