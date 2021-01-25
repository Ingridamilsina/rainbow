import React, { useMemo, useState } from 'react';
import styled from 'styled-components/primitives';
import { useTheme } from '../../context/ThemeContext';
import { initials } from '../../utils';
import { Centered } from '../layout';
import { Text } from '../text';
import { CoinIconSize } from './CoinIcon';
import { ImgixImage } from '@rainbow-me/images';
import { colors_NOT_REACTIVE, position } from '@rainbow-me/styles';
import ShadowStack from 'react-native-shadow-stack';

const RVLIBorderRadius = 16.25;
const RVLIShadows = {
  default: [
    [0, 4, 6, colors_NOT_REACTIVE.shadow, 0.04],
    [0, 1, 3, colors_NOT_REACTIVE.shadow, 0.08],
  ],
  large: [[0, 6, 10, colors_NOT_REACTIVE.shadow, 0.14]],
};

const Content = styled(Centered)`
  ${({ size }) => position.size(size)};
  background-color: ${({ color }) => color};
`;

export default function RequestVendorLogoIcon({
  backgroundColor,
  borderRadius = RVLIBorderRadius,
  dappName,
  imageUrl,
  shouldPrioritizeImageLoading,
  showLargeShadow,
  size = CoinIconSize,
  ...props
}) {
  const [error, setError] = useState(null);
  const { colors } = useTheme();

  // When dapps have no icon the bgColor provided to us is transparent.
  // Having a transparent background breaks our UI, so we instead show a background
  // color of white.
  const bgColor =
    backgroundColor === 'transparent'
      ? colors.white
      : backgroundColor || colors.dark;

  const imageSource = useMemo(
    () => ({
      priority:
        ImgixImage.priority[shouldPrioritizeImageLoading ? 'high' : 'low'],
      uri: imageUrl,
    }),
    [imageUrl, shouldPrioritizeImageLoading]
  );

  return (
    <ShadowStack
      {...props}
      {...position.sizeAsObject(size)}
      backgroundColor={colors.white}
      borderRadius={borderRadius}
      shadows={RVLIShadows[showLargeShadow ? 'large' : 'default']}
    >
      <Content color={bgColor} size={size}>
        {imageUrl && !error ? (
          <ImgixImage
            onError={setError}
            source={imageSource}
            style={position.sizeAsObject('100%')}
          />
        ) : (
          <Text
            align="center"
            color={colors.getFallbackTextColor(bgColor)}
            size="smedium"
            weight="semibold"
          >
            {initials(dappName)}
          </Text>
        )}
      </Content>
    </ShadowStack>
  );
}
