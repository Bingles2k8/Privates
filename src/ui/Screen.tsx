import { ScrollView, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { type ReactNode } from 'react';
import MaskedView from '@react-native-masked-view/masked-view';
import { Canvas, LinearGradient, Rect, vec } from '@shopify/react-native-skia';
import { PaperBackground } from './PaperBackground';

const FADE_HEIGHT = 22;

export function Screen({
  children,
  scroll = true,
  padded = true,
  topInset = true,
  stickyTop,
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
}) {
  const padCls = padded ? 'px-5' : '';
  const edges = topInset ? (['top'] as const) : ([] as const);
  // With a sticky bar, the bar already provides visual separation — tighten
  // the scrollview top padding so the first card doesn't float too far below.
  const topPadCls = stickyTop ? 'pt-4' : topInset ? 'pt-6' : 'pt-3';
  return (
    <View className="flex-1 bg-bg">
      <PaperBackground />
      <SafeAreaView className="flex-1" edges={edges}>
        {stickyTop}
        {scroll ? (
          <FadeTop>
            <ScrollView
              className="flex-1"
              contentContainerClassName={`${padCls} pb-16 ${topPadCls} gap-5`}
              showsVerticalScrollIndicator={false}
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
