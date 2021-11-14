/* eslint-disable sort-keys-fix/sort-keys-fix */
import React, { ReactNode } from 'react';
import { View } from 'react-native';
import { ColorModeProvider } from '../../color/ColorMode';
import { palettes } from '../../color/palettes';
import { CustomColor } from '../../color/useForegroundColor';
import { Docs } from '../../playground/Docs';
import { Guide } from '../../playground/Guide';
import { Inline } from '../Inline/Inline';
import { Stack } from '../Stack/Stack';
import { Text, TextProps } from './Text';

const textExamples: Required<Pick<TextProps, 'size' | 'weight'>>[] = [
  { size: '18px', weight: 'bold' },
  { size: '16px', weight: 'bold' },
  { size: '14px', weight: 'bold' },
  { size: '11px', weight: 'bold' },
];

const MockBadge = ({ children }: { children: ReactNode }) => (
  <View style={{ display: 'flex', flexDirection: 'row' }}>
    <View
      style={{
        backgroundColor: 'rgba(255,0,0,0.2)',
        borderRadius: 999,
        display: 'flex',
        justifyContent: 'center',
        paddingHorizontal: 18,
        paddingVertical: 6,
      }}
    >
      {children}
    </View>
  </View>
);

const loremIpsum =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

const customTextColor: CustomColor = {
  custom: {
    dark: 'salmon',
    darkTinted: 'pink',
    light: 'red',
  },
};

const docs: Docs = {
  name: 'Text',
  category: 'Content',
  examples: [
    ...textExamples.map(({ size, weight }) => ({
      name: `${size} (${weight})`,
      example: (
        <>
          <Stack space="10px">
            <View>
              <Guide />
              <Text size={size} weight={weight}>
                {loremIpsum}
              </Text>
              <Guide />
            </View>
            <Inline space="10px">
              <MockBadge>
                <Text size={size} weight={weight}>
                  CENTERED
                </Text>
              </MockBadge>
              <MockBadge>
                <Text size={size} weight={weight}>
                  Centered
                </Text>
              </MockBadge>
            </Inline>
          </Stack>
        </>
      ),
    })),
    {
      name: 'With emoji',
      example: (
        <>
          <Guide />
          <Text containsEmoji>Text with emoji 🌈</Text>
          <Guide />
        </>
      ),
    },
    {
      name: 'With truncation',
      example: (
        <>
          <Guide />
          <Text numberOfLines={1}>
            Truncated text truncated text truncated text truncated text
            truncated text truncated text
          </Text>
          <Guide />
        </>
      ),
    },
    {
      name: 'With color',
      example: (
        <Stack space="12px">
          <Text color="accent">Standard color</Text>
          <Text color={customTextColor}>Custom color</Text>
          <View>
            <View
              style={{
                backgroundColor: palettes.dark.backgroundColors.body.color,
                padding: 24,
              }}
            >
              <Stack space="24px">
                <ColorModeProvider value="dark">
                  <Stack space="12px">
                    <Text color="secondary50">Dark mode</Text>
                    <Text color={customTextColor}>Custom color</Text>
                  </Stack>
                </ColorModeProvider>

                <ColorModeProvider value="darkTinted">
                  <Stack space="12px">
                    <Text color="secondary50">Dark tinted mode</Text>
                    <Text color={customTextColor}>Custom color</Text>
                  </Stack>
                </ColorModeProvider>
              </Stack>
            </View>
          </View>
        </Stack>
      ),
    },
  ],
};

export default docs;