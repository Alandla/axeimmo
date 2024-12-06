import {type Dimensions, measureText as remotionMeasureText} from '@remotion/layout-utils';

export const fillTextBox = ({
  maxBoxWidth,
  maxLines,
}: {
  maxBoxWidth: number;
  maxLines: number;
}) => {
  // Initialise un tableau de lignes vides
  const lines: Array<Array<{
    text: string;
    fontFamily: string;
    fontWeight: number | string;
    fontSize: number;
    letterSpacing: number;
    fontVariantNumeric: string;
  }>> = new Array(maxLines).fill(0).map(() => []);

  return {
    add: ({
      text,
      fontFamily,
      fontWeight,
      fontSize,
      letterSpacing,
      fontVariantNumeric,
      validateFontIsLoaded,
      textTransform,
      additionalStyles,
    }: any) => {
        const lastLineIndex = lines.reduceRight((acc, curr, index) => {
            if (acc === -1 && curr.length > 0) {
              return index;
            }
            return acc;
          }, -1);
          const currentlyAt = lastLineIndex === -1 ? 0 : lastLineIndex;
          const lineToUse = lines[currentlyAt];
          const lineWithWord = [
            ...lineToUse,
            {
              text,
              fontFamily,
              fontWeight,
              fontSize,
              letterSpacing,
              fontVariantNumeric,
              validateFontIsLoaded,
              textTransform,
              additionalStyles
            }
          ];
          const widths = lineWithWord.map((w: any) => measureText(w).width);
          const lineWidthWithWordAdded = widths.reduce((a, b) => a + b, 0);
          if (Math.ceil(lineWidthWithWordAdded) < maxBoxWidth) {
            lines[currentlyAt].push({
              text: lines[currentlyAt].length === 0 ? text.trimStart() : text,
              fontFamily,
              fontWeight,
              fontSize,
              letterSpacing,
              fontVariantNumeric
            });
            return { exceedsBox: false, newLine: false };
          }
          if (currentlyAt === maxLines - 1) {
            return { exceedsBox: true, newLine: false };
          }
          if (lines[currentlyAt].length === 0 && currentlyAt === 0) {
            return { exceedsBox: true, newLine: false };
          }
          lines[currentlyAt + 1] = [
            {
              text: text.trimStart(),
              fontFamily,
              fontWeight,
              fontSize,
              letterSpacing,
              fontVariantNumeric
            }
          ];
          return { exceedsBox: false, newLine: true };
    },
  };
};

// Réexporte la fonction measureText de remotion pour la cohérence
export const measureText = remotionMeasureText;
