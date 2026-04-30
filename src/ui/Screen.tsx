import { Platform, ScrollView, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { type ReactNode } from 'react';
import MaskedView from '@react-native-masked-view/masked-view';
import { Canvas, LinearGradient, Rect, vec } from '@shopify/react-native-skia';
import { PaperBackground } from './PaperBackground';
import { useTheme } from '@/theme/useTheme';

// iOS gets a true alpha-mask fade (Skia + MaskedView) so content scrolling
// up actually fades to transparent and the PaperBackground shows through.
//
// Android uses ScrollView's native `fadingEdgeLength` prop instead — the
// Skia mask renders as fully opaque on some Android graphics backends
// (notably the emulator's GFXSTREAM passthrough where the EGL context
// errors out), which hides all UI underneath. A color-overlay alternative
// looks wrong because `palette.bg` is a flat color but the visible top of
// the screen is the PaperBackground's blurred colorful blobs — overlaying
// flat bg paints a dark/black band over the texture instead of blending.
// `fadingEdgeLength` is implemented natively by Android's view system as
// a true alpha edge, so the underlying PaperBackground shows through
// correctly as content scrolls past it.
const USE_MASKED_FADE = Platform.OS === 'ios';

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
          (() => {
            const scrollView = (
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
                // Android-only: native fading edge at the top of the
                // scroll view. Implemented at the platform layer as a true
                // alpha gradient over the rendered content, so the colorful
                // PaperBackground behind shows through naturally as content
                // scrolls past — no overlay color to worry about. Ignored
                // on iOS (which uses the Skia masked-view path below).
                fadingEdgeLength={Platform.OS === 'android' ? FADE_HEIGHT : 0}
              >
                {children}
              </ScrollView>
            );
            return USE_MASKED_FADE ? <FadeTop>{scrollView}</FadeTop> : scrollView;
          })()
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
