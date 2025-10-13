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
import { VideoElements } from './components/VideoElements';
import { Logo, LogoPosition } from './type/space';

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
	onElementPositionChange,
	onElementSizeChange,
	onElementRotationChange,
	onElementStartChange,
	onElementEndChange,
	onElementMediaChange,
	onElementDelete,
	onElementReorder,
	onPlayPause,
}: { 
	data: any, 
	showWatermark?: boolean,
	logo?: Logo,
	muteBackgroundMusic?: boolean,
	onSubtitleStyleChange?: (newStyle: any) => void,
	onAvatarHeightRatioChange?: (ratio: number) => void,
	onAvatarPositionChange?: (position: { x: number, y: number }) => void,
	onMediaPositionChange?: (sequenceId: number, position: { x: number, y: number }) => void,
	onLogoPositionChange?: (position: LogoPosition) => void;
	onLogoSizeChange?: (size: number) => void;
	onElementPositionChange?: (index: number, position: { x: number, y: number }) => void;
	onElementSizeChange?: (index: number, size: number) => void;
	onElementRotationChange?: (index: number, rotation: number) => void;
	onElementStartChange?: (index: number, start: number) => void;
	onElementEndChange?: (index: number, end: number) => void;
	onElementMediaChange?: (index: number) => void;
	onElementDelete?: (index: number) => void;
	onElementReorder?: (fromIndex: number, toIndex: number) => void;
	onPlayPause?: () => void;
}) => {
	// Vérification de sécurité pour éviter l'erreur quand data.video est null
	if (!data?.video) {
		return null;
	}

	const hasValidAvatar = data.video.avatar && (
		data.video.avatar.videoUrl || 
		data.video.avatar.previewUrl || 
		data.video.avatar.thumbnail ||
		(data.video.avatar.renders && data.video.avatar.renders.length > 0)
	);

	return (
		<>
			{ data.video.audio.url && <Audio src={data.video.audio.url} volume={data.video.audio.volume} /> }
			{ data.video.audio.voices && <Voices voices={data.video.audio.voices} volume={data.video.audio.volume} /> }
			{ data.video.audio.music && !muteBackgroundMusic && <Audio src={data.video.audio.music.url} volume={data.video.audio.music.volume} /> }
			{ showWatermark && <Watermark />}
			{ logo?.show && logo?.url && !showWatermark && <SpaceLogo 
				logoUrl={logo?.url}
				logoPosition={logo?.position}
				logoSize={logo?.size}
				onPositionChange={onLogoPositionChange}
				onSizeChange={onLogoSizeChange}
			/>}
			{ hasValidAvatar ? <BackgroundWithAvatar 
				sequences={data.video.sequences} 
				avatar={data.video.avatar} 
				duration={data.video.metadata.audio_duration} 
				avatarHeightRatio={data.settings?.avatarHeightRatio}
				videoFormat={data.video.format}
				onAvatarHeightRatioChange={onAvatarHeightRatioChange} 
				onAvatarPositionChange={onAvatarPositionChange}
				onMediaPositionChange={onMediaPositionChange}
				onPlayPause={onPlayPause}
			/> : <MediaBackground sequences={data.video.sequences} onMediaPositionChange={onMediaPositionChange} onPlayPause={onPlayPause} /> }
			{ data.video.transitions && <Transitions sequences={data.video.sequences} transitions={data.video.transitions} /> }
			{ data.video.elements && data.video.elements.length > 0 && <VideoElements 
				elements={data.video.elements} 
				sequences={data.video.sequences}
				onElementPositionChange={onElementPositionChange}
				onElementSizeChange={onElementSizeChange}
				onElementRotationChange={onElementRotationChange}
				onElementStartChange={onElementStartChange}
				onElementEndChange={onElementEndChange}
				onElementMediaChange={onElementMediaChange}
				onElementDelete={onElementDelete}
				onElementReorder={onElementReorder}
			/> }
			{ data.video.subtitle?.style?.template === 'bold' && <SubtitlesBold subtitleSequences={data.video.sequences} style={data.video.subtitle.style} videoFormat={data.video.format} onStyleChange={onSubtitleStyleChange} onPlayPause={onPlayPause} /> }
			{ data.video.subtitle?.style?.template === 'simple' && <SubtitlesSimple subtitleSequences={data.video.sequences} style={data.video.subtitle.style} onStyleChange={onSubtitleStyleChange} onPlayPause={onPlayPause} /> }
			{ data.video.subtitle?.style?.template === 'background' && <SubtitlesBackground subtitleSequences={data.video.sequences} style={data.video.subtitle.style} videoFormat={data.video.format} onStyleChange={onSubtitleStyleChange} onPlayPause={onPlayPause} /> }
			{ data.video.subtitle?.style?.template === 'clean' && <SubtitlesClean subtitleSequences={data.video.sequences} style={data.video.subtitle.style} videoFormat={data.video.format} onStyleChange={onSubtitleStyleChange} onPlayPause={onPlayPause} /> }
			{ data.video.subtitle?.style?.template === 'daniel' && <SubtitlesDaniel subtitleSequences={data.video.sequences} style={data.video.subtitle.style} videoFormat={data.video.format} onStyleChange={onSubtitleStyleChange} onPlayPause={onPlayPause} /> }
			{ data.video.subtitle?.style?.template === 'modern' && <SubtitlesModern subtitleSequences={data.video.sequences} style={data.video.subtitle.style} videoFormat={data.video.format} onStyleChange={onSubtitleStyleChange} onPlayPause={onPlayPause} /> }
		</>
	);
};
