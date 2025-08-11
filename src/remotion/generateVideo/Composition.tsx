import { Audio } from 'remotion';
import { MediaBackground } from './components/background';
import { SubtitlesBold } from './subtitles/bold/subtitlesBold';
import { SubtitlesSimple } from './subtitles/simple/subtitlesSimple';
import { SubtitlesBackground } from './subtitles/background/subtitlesBackground';
import { SubtitlesClean } from './subtitles/clean/subtitlesClean';
import { BackgroundWithAvatar } from './components/backgroundWithAvatar';
import { Watermark } from './components/Watermark';
import { SubtitlesDaniel } from './subtitles/daniel/subtitlesDaniel';
import { SubtitlesModern } from './subtitles/modern/subtitlesModern';
import { Voices } from './components/Audios';
import { Transitions } from './components/Transitions';
import { SpaceLogo } from './components/SpaceLogo';
import { LogoPosition } from '@/src/types/space';


interface LogoData {
	url?: string;
	position?: LogoPosition;
	show?: boolean;
	size?: number;
  }

export const VideoGenerate = ({ 
	data, 
	showWatermark = true,
	logo,
	muteBackgroundMusic = false,
	onSubtitleStyleChange,
	onAvatarHeightRatioChange,
	onAvatarPositionChange,
	onMediaPositionChange,
	onLogoPositionChange,
	onLogoSizeChange,
	onLogoClick,
}: { 
	data: any, 
	showWatermark?: boolean,
	logo?: LogoData,
	muteBackgroundMusic?: boolean,
	onSubtitleStyleChange?: (newStyle: any) => void,
	onAvatarHeightRatioChange?: (ratio: number) => void,
	onAvatarPositionChange?: (position: { x: number, y: number }) => void,
	onMediaPositionChange?: (sequenceId: number, position: { x: number, y: number }) => void,
	onLogoPositionChange?: (position: LogoPosition) => void;
	onLogoSizeChange?: (size: number) => void;
	onLogoClick?: () => void;
}) => {
	// Vérification de sécurité pour éviter l'erreur quand data.video est null
	if (!data?.video) {
		return null;
	}

	return (
		<>
			{ data.video.audio.url && <Audio src={data.video.audio.url} volume={data.video.audio.volume} /> }
			{ data.video.audio.voices && <Voices voices={data.video.audio.voices} volume={data.video.audio.volume} /> }
			{ data.video.audio.music && !muteBackgroundMusic && <Audio src={data.video.audio.music.url} volume={data.video.audio.music.volume} /> }
			{ showWatermark && <Watermark />}
			<SpaceLogo 
				logoUrl={logo?.url}
				logoPosition={logo?.position}
				showLogo={logo?.show}
				logoSize={logo?.size}
				onPositionChange={onLogoPositionChange}
				onSizeChange={onLogoSizeChange}
				onLogoClick={onLogoClick}
			/>
			{ data.video.avatar ? <BackgroundWithAvatar 
				sequences={data.video.sequences} 
				avatar={data.video.avatar} 
				duration={data.video.metadata.audio_duration} 
				avatarHeightRatio={data.settings?.avatarHeightRatio}
				onAvatarHeightRatioChange={onAvatarHeightRatioChange} 
				onAvatarPositionChange={onAvatarPositionChange}
				onMediaPositionChange={onMediaPositionChange}
			/> : <MediaBackground sequences={data.video.sequences} onMediaPositionChange={onMediaPositionChange} /> }
			{ data.video.transitions && <Transitions sequences={data.video.sequences} transitions={data.video.transitions} /> }
			{ data.video.subtitle?.style?.template === 'bold' && <SubtitlesBold subtitleSequences={data.video.sequences} style={data.video.subtitle.style} videoFormat={data.video.format} onStyleChange={onSubtitleStyleChange} /> }
			{ data.video.subtitle?.style?.template === 'simple' && <SubtitlesSimple subtitleSequences={data.video.sequences} style={data.video.subtitle.style} onStyleChange={onSubtitleStyleChange} /> }
			{ data.video.subtitle?.style?.template === 'background' && <SubtitlesBackground subtitleSequences={data.video.sequences} style={data.video.subtitle.style} videoFormat={data.video.format} onStyleChange={onSubtitleStyleChange} /> }
			{ data.video.subtitle?.style?.template === 'clean' && <SubtitlesClean subtitleSequences={data.video.sequences} style={data.video.subtitle.style} videoFormat={data.video.format} onStyleChange={onSubtitleStyleChange} /> }
			{ data.video.subtitle?.style?.template === 'daniel' && <SubtitlesDaniel subtitleSequences={data.video.sequences} style={data.video.subtitle.style} videoFormat={data.video.format} onStyleChange={onSubtitleStyleChange} /> }
			{ data.video.subtitle?.style?.template === 'modern' && <SubtitlesModern subtitleSequences={data.video.sequences} style={data.video.subtitle.style} videoFormat={data.video.format} onStyleChange={onSubtitleStyleChange} /> }
		</>
	);
};
