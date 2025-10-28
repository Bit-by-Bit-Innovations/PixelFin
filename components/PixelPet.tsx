import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Image, ImageSourcePropType, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

const PET_SIZE = 128;

export type PixelPetMood = 'idle' | 'happy' | 'sad' | 'neutral' | null | undefined;

type SpriteFrame = {
  uri: string;
  width?: number | null;
  height?: number | null;
};

type SpriteManifest = Record<'idle' | 'happy' | 'sad', SpriteFrame[]>;

const FPS_BY_MOOD: Record<'idle' | 'happy' | 'sad', number> = {
  idle: 6,
  happy: 10,
  sad: 4,
};

const resolveFrameFromModule = (assetModule: ImageSourcePropType): SpriteFrame => {
  const resolved = Image.resolveAssetSource(assetModule);
  return {
    uri: resolved.uri,
    width: resolved.width,
    height: resolved.height,
  };
};

const DEFAULT_MANIFEST: SpriteManifest = {
  idle: [resolveFrameFromModule(require('../assets/pet/idle.png'))],
  happy: [resolveFrameFromModule(require('../assets/pet/happy.png'))],
  sad: [resolveFrameFromModule(require('../assets/pet/sad.png'))],
};

const ensureTrailingSlash = (uri: string) => (uri.endsWith('/') ? uri : `${uri}/`);

const sanitizeSpriteFrames = (frames: SpriteFrame[]) => frames.filter((frame) => typeof frame.uri === 'string' && frame.uri.length > 0);

const loadSpriteFramesFromDirectory = async (baseUri: string, mood: keyof SpriteManifest): Promise<SpriteFrame[]> => {
  const base = ensureTrailingSlash(baseUri);
  const moodDirectoryUri = `${base}pet/${mood}`;

  try {
    const pointer = await FileSystem.getInfoAsync(moodDirectoryUri);
    if (pointer.exists && pointer.isDirectory) {
      const entries = await FileSystem.readDirectoryAsync(moodDirectoryUri);
      const frameFiles = entries.filter((name) => name.toLowerCase().endsWith('.png')).sort((a, b) => a.localeCompare(b));

      const frames = await Promise.all(
        frameFiles.map(async (fileName) => {
          const fileUri = `${ensureTrailingSlash(moodDirectoryUri)}${fileName}`;
          const asset = Asset.fromURI(fileUri);
          if (!asset.localUri) {
            try {
              await asset.downloadAsync();
            } catch (err) {
              if (__DEV__) {
                console.warn(`[PixelPet] Failed to download sprite frame ${fileUri}:`, err);
              }
            }
          }
          return {
            uri: asset.localUri ?? asset.uri ?? fileUri,
            width: asset.width,
            height: asset.height,
          } satisfies SpriteFrame;
        }),
      );

      return sanitizeSpriteFrames(frames);
    }
  } catch (err) {
    if (__DEV__) {
      console.warn(`[PixelPet] Unable to inspect sprite directory for ${mood}:`, err);
    }
  }

  const singularAssetUri = `${base}pet/${mood}.png`;

  try {
    const pointer = await FileSystem.getInfoAsync(singularAssetUri);
    if (pointer.exists && pointer.isDirectory === false) {
      const asset = Asset.fromURI(pointer.uri ?? singularAssetUri);
      if (!asset.localUri) {
        try {
          await asset.downloadAsync();
        } catch (err) {
          if (__DEV__) {
            console.warn(`[PixelPet] Failed to download sprite frame ${singularAssetUri}:`, err);
          }
        }
      }

      return sanitizeSpriteFrames([
        {
          uri: asset.localUri ?? asset.uri ?? singularAssetUri,
          width: asset.width,
          height: asset.height,
        },
      ]);
    }
  } catch (err) {
    if (__DEV__) {
      console.warn(`[PixelPet] Unable to load sprite asset for ${mood}:`, err);
    }
  }

  return [];
};

const loadSpriteFrames = async (): Promise<SpriteManifest> => {
  const assetDirectory = FileSystem.assetDirectory;
  if (!assetDirectory) {
    return DEFAULT_MANIFEST;
  }

  const manifestEntries = await Promise.all(
    (Object.keys(DEFAULT_MANIFEST) as (keyof SpriteManifest)[]).map(async (mood) => {
      const frames = await loadSpriteFramesFromDirectory(assetDirectory, mood);
      return [mood, frames] as const;
    }),
  );

  return manifestEntries.reduce<SpriteManifest>((acc, [mood, frames]) => {
    acc[mood] = frames.length > 0 ? frames : DEFAULT_MANIFEST[mood];
    return acc;
  }, { ...DEFAULT_MANIFEST });
};

type SpriteAnimatorProps = {
  frames: SpriteFrame[];
  fps: number;
};

const SpriteAnimator: React.FC<SpriteAnimatorProps> = ({ frames, fps }) => {
  const [frameIndex, setFrameIndex] = useState(0);
  const frameCount = frames.length;
  const timerRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number>(0);

  useEffect(() => {
    setFrameIndex(0);
  }, [frameCount]);

  useEffect(() => {
    if (frameCount <= 1 || fps <= 0) {
      return undefined;
    }

    const frameInterval = 1000 / fps;
    let isMounted = true;

    const loop = (timestamp: number) => {
      if (!isMounted) {
        return;
      }

      if (!lastTimestampRef.current) {
        lastTimestampRef.current = timestamp;
      }

      const elapsed = timestamp - lastTimestampRef.current;
      if (elapsed >= frameInterval) {
        lastTimestampRef.current = timestamp;
        setFrameIndex((current) => (current + 1) % frameCount);
      }

      timerRef.current = requestAnimationFrame(loop);
    };

    timerRef.current = requestAnimationFrame(loop);

    return () => {
      isMounted = false;
      if (timerRef.current !== null) {
        cancelAnimationFrame(timerRef.current);
        timerRef.current = null;
      }
      lastTimestampRef.current = 0;
    };
  }, [frameCount, fps]);

  const frame = frames[Math.min(frameIndex, frameCount - 1)];

  return <Image accessibilityIgnoresInvertColors resizeMode="contain" source={{ uri: frame.uri }} style={styles.frame} />;
};

type PixelPetProps = {
  mood?: PixelPetMood;
  style?: StyleProp<ViewStyle>;
};

const normalizeMood = (mood?: PixelPetMood): keyof SpriteManifest => {
  if (mood === 'happy') {
    return 'happy';
  }
  if (mood === 'sad') {
    return 'sad';
  }
  return 'idle';
};

const PixelPet: React.FC<PixelPetProps> = ({ mood, style }) => {
  const [sprites, setSprites] = useState<SpriteManifest>(DEFAULT_MANIFEST);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isActive = true;

    const hydrate = async () => {
      try {
        const manifest = await loadSpriteFrames();
        if (isActive) {
          setSprites(manifest);
        }
      } catch (err) {
        if (__DEV__) {
          console.warn('[PixelPet] Falling back to default sprites:', err);
        }
        if (isActive) {
          setSprites(DEFAULT_MANIFEST);
        }
      } finally {
        if (isActive) {
          setIsReady(true);
        }
      }
    };

    void hydrate();

    return () => {
      isActive = false;
    };
  }, []);

  const displayMood = useMemo(() => normalizeMood(mood), [mood]);
  const frames = sprites[displayMood];

  const fallbackMoodOrder: (keyof SpriteManifest)[] = useMemo(() => {
    const unique: (keyof SpriteManifest)[] = [];
    const enqueue = (candidate: keyof SpriteManifest) => {
      if (!unique.includes(candidate)) {
        unique.push(candidate);
      }
    };

    enqueue(displayMood);
    enqueue('idle');
    enqueue('happy');
    enqueue('sad');

    return unique;
  }, [displayMood]);

  const activeMood = useMemo(() => {
    for (const moodKey of fallbackMoodOrder) {
      if (sprites[moodKey] && sprites[moodKey].length > 0) {
        return moodKey;
      }
    }
    return 'idle';
  }, [fallbackMoodOrder, sprites]);

  const activeFrames = sprites[activeMood];
  const hasRenderableFrame = activeFrames.length > 0;

  if (!hasRenderableFrame) {
    return (
      <View style={[styles.stage, style]}>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderLabel}>No pet</Text>
        </View>
      </View>
    );
  }

  const fps = FPS_BY_MOOD[activeMood];
  const shouldAnimate = activeFrames.length > 1 && isReady;

  return (
    <View
      accessibilityLabel={`Pixel pet mood: ${activeMood}`}
      style={[styles.stage, style]}
      accessibilityRole="image"
    >
      {shouldAnimate ? <SpriteAnimator frames={activeFrames} fps={fps} /> : (
        <Image accessibilityIgnoresInvertColors resizeMode="contain" source={{ uri: activeFrames[0].uri }} style={styles.frame} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  stage: {
    width: PET_SIZE,
    height: PET_SIZE,
    borderRadius: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  frame: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: PET_SIZE - 24,
    height: PET_SIZE - 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.25)',
  },
  placeholderLabel: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 10,
    color: '#cbd5f5',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

export default PixelPet;
